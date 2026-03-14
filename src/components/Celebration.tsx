"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { getRandomReward } from "@/lib/storage";

interface CelebrationProps {
  taskTitle: string;
  onNewTask: () => void;
}

function ConfettiPiece({ index, delay }: { index: number; delay: number }) {
  const colors = ["#8b5cf6", "#d946ef", "#f59e0b", "#10b981", "#3b82f6"];
  const color = colors[index % colors.length];
  const left = (index * 17) % 100;
  const size = 4 + (index % 8);
  const rotate = ((index * 37) % 720) - 360;
  const x = ((index * 43) % 200) - 100;
  const duration = 2 + (index % 8) * 0.1;

  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        left: `${left}%`,
        top: -10,
        width: size,
        height: size,
        backgroundColor: color,
      }}
      initial={{ y: -10, opacity: 1, rotate: 0 }}
      animate={{
        y: 600,
        opacity: 0,
        rotate,
        x,
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

export default function Celebration({ taskTitle, onNewTask }: CelebrationProps) {
  const [reward] = useState(() => getRandomReward());

  return (
    <div className="relative w-full max-w-lg mx-auto text-center overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} delay={i * 0.05} />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <div className="text-7xl mb-6" style={{textAlign:"center"}}>
          <img src="/images/confetti.png" style={{width: "370px", height: "auto", display: "inline-block", marginLeft: "10px"}}></img>
        </div>
      </motion.div>

      <motion.h2
        className="text-3xl font-bold mb-2 text-blue-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        You did it!
      </motion.h2>

      <motion.p
        className="text-gray-400 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        &ldquo;{taskTitle}&rdquo; — crushed it.
      </motion.p>

      {reward && (
        <motion.div
          className="bg-[#fce7bd] border border-white rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-sm text-[#65b5f7] font-medium mb-2">
            YOUR REWARD
          </div>
          <div className="text-lg font-semibold text-[#97cffc]">{reward}</div>
        </motion.div>
      )}

      <motion.button
        onClick={onNewTask}
        className="py-4 px-8 rounded-2xl font-bold cursor-pointer
                   bg-gradient-to-r from-[#abd9ff] to-[#87c6fa] text-white
                   hover:from-[#97cffc] hover:to-[#65b5f7] transition-all"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Tackle Another Task
      </motion.button>
    </div>
  );
}
