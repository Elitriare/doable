"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface Props {
  points: number | null; // null = hidden
  onDone: () => void;
}

export default function PointsToast({ points, onDone }: Props) {
  useEffect(() => {
    if (points === null) return;
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [points, onDone]);

  const isPositive = (points ?? 0) > 0;

  return (
    <AnimatePresence>
      {points !== null && (
        <motion.div
          className="fixed top-6 left-1/2 z-[100] pointer-events-none"
          initial={{ opacity: 0, y: -40, x: "-50%", scale: 0.6 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: -30, x: "-50%", scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-sm border ${
              isPositive
                ? "bg-[#e8f7e8]/90 border-green-200 text-green-700"
                : "bg-red-50/90 border-red-200 text-red-600"
            }`}
          >
            <motion.span
              className="text-2xl"
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
            >
              {isPositive ? "+" : ""}
            </motion.span>
            <motion.span
              className="text-xl font-bold tabular-nums"
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.3, 1] }}
              transition={{ duration: 0.4, times: [0, 0.6, 1] }}
            >
              {isPositive ? "+" : ""}{points} pts
            </motion.span>
            <motion.span
              className="text-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isPositive ? "🎯" : "💔"}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
