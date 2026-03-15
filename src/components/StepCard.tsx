"use client";

import { motion, AnimatePresence } from "framer-motion";
import JournalEntry from "./JournalEntry";
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
        className="w-full max-w-lg mx-auto"
      >
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
          <div className="text-sm text-violet-400 font-medium mb-4 text-center">
            FOCUS ON THIS
          </div>
          <p className="text-xl font-semibold text-white mb-8 leading-relaxed text-center">
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
      </motion.div>
    </AnimatePresence>
  );
}