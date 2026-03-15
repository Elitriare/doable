"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppScreen, AppTab, BlockerType, Task, Step, JournalEntryData } from "@/types";
import {
  saveTask,
  deleteTask,
  getActiveTask,
  pullTasksFromDb,
  pullProfileFromDb,
  ensureUserScope,
  awardPoints,
  getStreak,
  isFirstTaskToday,
  getPoints,
} from "@/lib/storage";
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  scheduleComebackNotification,
  cancelComebackNotification,
  scheduleStreakWarning,
  startReminderPolling,
  stopReminderPolling,
} from "@/lib/notifications";
import TaskInput from "@/components/TaskInput";
import BlockerSelect from "@/components/BlockerSelect";
import StepCard from "@/components/StepCard";
import ProgressBar from "@/components/ProgressBar";
import Celebration from "@/components/Celebration";
import LoadingCoach from "@/components/LoadingCoach";
import ScheduleReminder from "@/components/ScheduleReminder";
import JournalDrawer from "@/components/JournalDrawer";
import Analytics from "@/components/Analytics";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import CalendarSync from "@/components/CalendarSync";
import CalendarEvents from "@/components/CalendarEvents";
import CalendarTab from "@/components/CalendarTab";
import Leaderboard from "@/components/Leaderboard";
import PointsToast from "@/components/PointsToast";
import LoginScreen from "@/components/LoginScreen";

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [screen, setScreen] = useState<AppScreen>("home");
  const [activeTab, setActiveTab] = useState<AppTab>("coach");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Points toast state
  const [toastPoints, setToastPoints] = useState<number | null>(null);
  // Track points earned during current task session for celebration screen
  const [sessionPoints, setSessionPoints] = useState(0);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker().then(async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await subscribeToPush();
      }
    });
    return () => stopReminderPolling();
  }, []);

  // Sync with MongoDB when session becomes available
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const syncAndRestore = async () => {
      // Clear stale localStorage if a different user logged in
      ensureUserScope(session!.user!.email!);
      // Pull tasks from DB (DB is source of truth)
      await pullTasksFromDb();
      // Pull profile (points, friendCode, etc.)
      await pullProfileFromDb();
      // Restore active task
      const active = getActiveTask();
      if (active) {
        setCurrentTask(active);
        setTaskTitle(active.title);
        setScreen("coaching");
      }

      // Schedule streak warning if user has a streak going
      const streak = getStreak();
      if (streak >= 2 && isFirstTaskToday()) {
        scheduleStreakWarning(streak);
      }

      // Start polling for due reminders (sends push notifications)
      startReminderPolling();
    };

    syncAndRestore();
  }, [authStatus]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && screen === "coaching" && currentTask && !currentTask.completed) {
      const progress = `${Math.round((currentTask.currentStep / currentTask.steps.length) * 100)}%`;
      scheduleComebackNotification(currentTask.title, progress);
    } else if (!document.hidden) {
      cancelComebackNotification();
    }
  }, [screen, currentTask]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Helper: award points and show toast
  const award = (delta: number, reason: Parameters<typeof awardPoints>[1], title: string) => {
    awardPoints(delta, reason, title);
    setToastPoints((prev) => (prev ?? 0) + delta);
    setSessionPoints((prev) => prev + delta);
  };

  const handleTaskSubmit = (task: string) => {
    setTaskTitle(task);
    setScreen("blocker");
  };

  const handleCalendarImport = (title: string) => {
    setTaskTitle(title);
    setScreen("blocker");
  };

  const handleBlockerSelect = async (blocker: BlockerType) => {
    setLoading(true);
    setError("");
    setScreen("coaching");
    setSessionPoints(0); // Reset session points for new task

    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskTitle, blocker }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate steps");
      }

      const data = await res.json();
      const now = Date.now();

      const task: Task = {
        id: crypto.randomUUID(),
        title: taskTitle,
        blocker,
        category: data.category || "Uncategorized",
        steps: data.steps as Step[],
        currentStep: 0,
        completed: false,
        createdAt: now,
        startedAt: now,
        journal: [],
        calendarEventIds: [],
      };

      setCurrentTask(task);
      saveTask(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setScreen("home");
    } finally {
      setLoading(false);
    }
  };

  const handleStepDone = (entry: Omit<JournalEntryData, "stepIndex" | "stepText" | "completedAt">) => {
    if (!currentTask) return;

    const now = Date.now();

    const journalEntry: JournalEntryData = {
      ...entry,
      stepIndex: currentTask.currentStep,
      stepText: currentTask.steps[currentTask.currentStep].step,
      completedAt: now,
    };

    const nextStep = currentTask.currentStep + 1;
    const isLast = nextStep >= currentTask.steps.length;

    const updatedTask: Task = {
      ...currentTask,
      currentStep: isLast ? currentTask.currentStep : nextStep,
      completed: isLast,
      completedAt: isLast ? now : undefined,
      journal: [...currentTask.journal, journalEntry],
    };

    setCurrentTask(updatedTask);
    saveTask(updatedTask);

    // Award step points
    award(10, "step_complete", currentTask.title);

    if (isLast) {
      // Task completion bonus
      award(25, "task_complete", currentTask.title);

      // Streak bonus (capped at +50)
      const streak = getStreak();
      if (streak > 0) {
        const streakBonus = Math.min(streak * 5, 50);
        award(streakBonus, "streak_bonus", currentTask.title);
      }

      // First task of the day bonus
      if (isFirstTaskToday()) {
        award(10, "first_today", currentTask.title);
      }

      setScreen("complete");
    }
  };

  const handleNewTask = () => {
    cancelComebackNotification();

    // delete calendar events if task was abandoned mid-way
    if (
      currentTask &&
      !currentTask.completed &&
      currentTask.calendarEventIds?.length
    ) {
      fetch("/api/calendar/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventIds: currentTask.calendarEventIds }),
      });
    }

    setCurrentTask(null);
    setTaskTitle("");
    setError("");
    setSessionPoints(0);
    setScreen("home");
  };

  const handleResumeTask = (task: Task) => {
    setCurrentTask(task);
    setTaskTitle(task.title);
    setSessionPoints(0);
    setActiveTab("coach");
    setScreen("coaching");
  };

  const handleForfeitTask = (task: Task) => {
    // Clean up calendar events if any
    if (task.calendarEventIds?.length) {
      fetch("/api/calendar/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventIds: task.calendarEventIds }),
      });
    }
    deleteTask(task.id);

    // Deduct points for forfeit
    awardPoints(-15, "forfeit", task.title);
    setToastPoints(-15);

    // If this was the active task, clear it
    if (currentTask?.id === task.id) {
      setCurrentTask(null);
      setTaskTitle("");
      setScreen("home");
    }
  };

  const currentStep = currentTask?.steps[currentTask.currentStep];

  // Show tabs on non-coach tabs, or on coach tab when at home/no active task
  const showTabs = activeTab !== "coach" || screen === "home" || (screen === "coaching" && !currentTask);

  // Auth loading state
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#4a8fe7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show login screen
  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Points Toast */}
      <PointsToast points={toastPoints} onDone={() => setToastPoints(null)} />

      {/* Tab Navigation */}
      {showTabs && (
        <nav className="flex items-center justify-between pt-6 pb-2 px-4">
          <div className="w-16" />
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("coach")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "coach"
                  ? "bg-[#4a8fe7] text-white shadow-md"
                  : "bg-white/50 text-[#5a7fa8] hover:bg-white/70"
              }`}
            >
              Coach
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-[#4a8fe7] text-white shadow-md"
                  : "bg-white/50 text-[#5a7fa8] hover:bg-white/70"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab("compete")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "compete"
                  ? "bg-[#4a8fe7] text-white shadow-md"
                  : "bg-white/50 text-[#5a7fa8] hover:bg-white/70"
              }`}
            >
              Compete
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[#4a8fe7] text-white shadow-md"
                  : "bg-white/50 text-[#5a7fa8] hover:bg-white/70"
              }`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={() => signOut()}
            className="text-xs text-[#5a7fa8] hover:text-[#2e6dc0] transition-colors cursor-pointer px-2 py-1"
            title={session.user?.email || "Sign out"}
          >
            Sign out
          </button>
        </nav>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 px-6 py-3 rounded-xl text-sm z-50">
            {error}
          </div>
        )}

        {activeTab === "calendar" && (
          <CalendarTab
            onImport={handleCalendarImport}
            onResume={handleResumeTask}
            onForfeit={handleForfeitTask}
          />
        )}

        {activeTab === "compete" && <Leaderboard />}

        {activeTab === "analytics" && <Analytics />}

        {activeTab === "coach" && (
          <>
            {screen === "home" && (
              <>
                <TaskInput onSubmit={handleTaskSubmit} />
                <ScheduleReminder />
              </>
            )}

            {screen === "blocker" && <BlockerSelect onSelect={handleBlockerSelect} />}

            {screen === "coaching" && loading && <LoadingCoach />}

            {screen === "coaching" && !loading && currentTask && currentStep && (
              <div className="w-full max-w-lg mx-auto space-y-8">
                <ProgressBar
                  current={currentTask.currentStep}
                  total={currentTask.steps.length}
                />
                <StepCard
                  step={currentStep.step}
                  journalPrompt={currentStep.journalPrompt}
                  stepNumber={currentTask.currentStep + 1}
                  totalSteps={currentTask.steps.length}
                  onDone={handleStepDone}
                />
                <JournalDrawer entries={currentTask.journal} />
                <button
                  onClick={handleNewTask}
                  className="block mx-auto text-sm text-[#5a7fa8] hover:text-[#2e6dc0] transition-colors cursor-pointer"
                >
                  Start over
                </button>
              </div>
            )}

            {screen === "complete" && currentTask && (
              <Celebration
                taskTitle={currentTask.title}
                onNewTask={handleNewTask}
                pointsEarned={sessionPoints}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Spotify Player */}
      <SpotifyPlayer />
    </div>
  );
}
