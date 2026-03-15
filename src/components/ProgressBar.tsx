"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-[#3a6a94] mb-2">
        <span>
          Step {Math.min(current + 1, total)} of {total}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-3 bg-white rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#4a8fe7]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
