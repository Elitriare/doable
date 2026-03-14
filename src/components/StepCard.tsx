"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StepCardProps {
  step: string;
  stepNumber: number;
  totalSteps: number;
  onDone: () => void;
}

export default function StepCard({ step, stepNumber, totalSteps, onDone }: StepCardProps) {
  const isLast = stepNumber === totalSteps;

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
          <motion.button
            onClick={onDone}
            className="w-full py-4 rounded-2xl font-bold text-lg cursor-pointer
                       bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white
                       hover:from-violet-600 hover:to-fuchsia-600 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLast ? "Finish!" : "Done — Next Step"}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
