"use client";

import { useState, useEffect, useCallback } from "react";
import { AppScreen, AppTab, BlockerType, Task, Step, JournalEntryData } from "@/types";
import { saveTask } from "@/lib/storage";
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

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [activeTab, setActiveTab] = useState<AppTab>("coach");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    registerServiceWorker().then(() => requestNotificationPermission());
  }, []);

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
    setCurrentTask(null);
    setTaskTitle("");
    setError("");
    setScreen("home");
  };

  const currentStep = currentTask?.steps[currentTask.currentStep];

  // During active coaching, hide the tab bar
  const showTabs = screen === "home" || (screen === "coaching" && !currentTask);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Tab Navigation */}
      {showTabs && (
        <nav className="flex justify-center gap-1 pt-6 pb-2 px-4">
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
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-[#4a8fe7] text-white shadow-md"
                : "bg-white/50 text-[#5a7fa8] hover:bg-white/70"
            }`}
          >
            Analytics
          </button>
        </nav>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 px-6 py-3 rounded-xl text-sm z-50">
            {error}
          </div>
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
