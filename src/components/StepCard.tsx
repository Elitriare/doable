"use client";

import { motion, AnimatePresence } from "framer-motion";
import JournalEntry from "./JournalEntry";
import PomodoroTimer from "./PomodoroTimer";
import { JournalEntryData } from "@/types";

interface StepCardProps {
  step: string;
  journalPrompt: string;
  stepNumber: number;
  totalSteps: number;
  onDone: (entry: Omit<JournalEntryData, "stepIndex" | "stepText" | "completedAt">) => void;
}

export default function StepCard({ step, journalPrompt, stepNumber, totalSteps, onDone }: StepCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepNumber}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg mx-auto space-y-4"
      >
        <div className="bg-[#fce7bd] border border-white rounded-3xl p-8 text-center">
          <div className="text-sm text-[#4a8fe7] font-medium mb-4">
            FOCUS ON THIS
          </div>
          <p className="text-xl font-semibold text-[#1f3a5c] mb-8 leading-relaxed text-center">
            {step}
          </p>
          <JournalEntry
            step={step}
            journalPrompt={journalPrompt}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
            onComplete={onDone}
          />
        </div>

        {/* Pomodoro timer below the card */}
        <div className="bg-white/60 border border-[#b8d4ed] rounded-2xl p-5">
          <PomodoroTimer />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
