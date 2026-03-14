"use client";

import { motion, AnimatePresence } from "framer-motion";
import ProofUpload from "./ProofUpload";

interface StepCardProps {
  step: string;
  stepNumber: number;
  totalSteps: number;
  onDone: () => void;
}

export default function StepCard({ step, stepNumber, totalSteps, onDone }: StepCardProps) {
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
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center">
          <div className="text-sm text-violet-400 font-medium mb-4">
            FOCUS ON THIS
          </div>
          <p className="text-xl font-semibold text-white mb-8 leading-relaxed">
            {step}
          </p>
          <div className="text-left">
            <ProofUpload
              step={step}
              onComplete={() => onDone()}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}