"use client";

import { useState } from "react";
import { AppScreen, BlockerType, Task } from "@/types";
import { saveTask } from "@/lib/storage";
import TaskInput from "@/components/TaskInput";
import BlockerSelect from "@/components/BlockerSelect";
import StepCard from "@/components/StepCard";
import ProgressBar from "@/components/ProgressBar";
import Celebration from "@/components/Celebration";
import LoadingCoach from "@/components/LoadingCoach";

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      const task: Task = {
        id: crypto.randomUUID(),
        title: taskTitle,
        blocker,
        steps: data.steps.map((text: string, i: number) => ({
          id: i,
          text,
          completed: false,
        })),
        currentStep: 0,
        completed: false,
        createdAt: Date.now(),
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

  const handleStepDone = () => {
    if (!currentTask) return;

    const nextStep = currentTask.currentStep + 1;

    if (nextStep >= currentTask.steps.length) {
      const completedTask = { ...currentTask, completed: true };
      setCurrentTask(completedTask);
      saveTask(completedTask);
      setScreen("complete");
    } else {
      const updatedTask = {
        ...currentTask,
        currentStep: nextStep,
        steps: currentTask.steps.map((s, i) =>
          i < nextStep ? { ...s, completed: true } : s
        ),
      };
      setCurrentTask(updatedTask);
      saveTask(updatedTask);
    }
  };

  const handleNewTask = () => {
    setCurrentTask(null);
    setTaskTitle("");
    setError("");
    setScreen("home");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 px-6 py-3 rounded-xl text-sm z-50">
          {error}
        </div>
      )}

      {screen === "home" && <TaskInput onSubmit={handleTaskSubmit} />}

      {screen === "blocker" && <BlockerSelect onSelect={handleBlockerSelect} />}

      {screen === "coaching" && loading && <LoadingCoach />}

      {screen === "coaching" && !loading && currentTask && (
        <div className="w-full max-w-lg mx-auto space-y-8">
          <ProgressBar
            current={currentTask.currentStep}
            total={currentTask.steps.length}
          />
          <StepCard
            step={currentTask.steps[currentTask.currentStep].text}
            stepNumber={currentTask.currentStep + 1}
            totalSteps={currentTask.steps.length}
            onDone={handleStepDone}
          />
          <button
            onClick={handleNewTask}
            className="block mx-auto text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Start over
          </button>
        </div>
      )}

      {screen === "complete" && currentTask && (
        <Celebration taskTitle={currentTask.title} onNewTask={handleNewTask} />
      )}
    </main>
  );
}
