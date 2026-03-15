"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppScreen, AppTab, BlockerType, Task, Step, JournalEntryData } from "@/types";
import { saveTask, getActiveTask, pullTasksFromDb, pushAllTasksToDb } from "@/lib/storage";
import {
  registerServiceWorker,
  requestNotificationPermission,
  scheduleComebackNotification,
  cancelComebackNotification,
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
import LoginScreen from "@/components/LoginScreen";

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [screen, setScreen] = useState<AppScreen>("home");
  const [activeTab, setActiveTab] = useState<AppTab>("coach");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore active session on mount + sync with DB when logged in
  useEffect(() => {
    registerServiceWorker().then(() => requestNotificationPermission());
  }, []);

  // Sync with MongoDB when session becomes available
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const syncAndRestore = async () => {
      // Push any local tasks to DB (migration for first login)
      await pushAllTasksToDb();
      // Pull merged tasks from DB
      await pullTasksFromDb();
      // Restore active task
      const active = getActiveTask();
      if (active) {
        setCurrentTask(active);
        setTaskTitle(active.title);
        setScreen("coaching");
      }
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

    if (isLast) {
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
    setScreen("home");
  };

  const currentStep = currentTask?.steps[currentTask.currentStep];

  // During active coaching, hide the tab bar
  const showTabs = screen === "home" || (screen === "coaching" && !currentTask);

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
      {/* Tab Navigation */}
      {showTabs && (
        <nav className="flex items-center justify-between pt-6 pb-2 px-4">
          <div className="w-16" />
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("coach")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "coach"
                  ? "bg-[#4a8fe7] text-white shadow-md"
                  : "bg-white/50 text-[#5a7fa8] hover:bg-white/70"
              }`}
            >
              Coach
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-[#4a8fe7] text-white shadow-md"
                  : "bg-white/50 text-[#5a7fa8] hover:bg-white/70"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
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

        {activeTab === "calendar" && screen === "home" && (
          <CalendarTab onImport={handleCalendarImport} />
        )}

        {activeTab === "analytics" && screen === "home" && <Analytics />}

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
              <Celebration taskTitle={currentTask.title} onNewTask={handleNewTask} />
            )}
          </>
        )}
      </main>

      {/* Floating Spotify Player */}
      <SpotifyPlayer />
    </div>
  );
}
