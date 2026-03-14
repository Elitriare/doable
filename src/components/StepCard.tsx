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
        <div className="bg-[#fce7bd] border border-white rounded-3xl p-8 text-center">
          <div className="text-sm text-blue-400 font-medium mb-4">
            FOCUS ON THIS
          </div>
          <p className="text-xl font-semibold text-white mb-8 leading-relaxed">
            {step}
          </p>
          <img src="/images/lockingin.png" style={{width: "150px", height: "auto"}}></img>
          <motion.button
            onClick={onDone}
            className="w-full py-4 rounded-2xl font-bold text-lg cursor-pointer
                       bg-gradient-to-r from-[#abd9ff] to-[#87c6fa] text-white
                       hover:from-[#97cffc] hover:to-[#65b5f7] transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLast ? "Finish!" : "Done — Next Step"}
          </motion.button>
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