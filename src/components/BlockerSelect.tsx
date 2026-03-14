"use client";

import { motion } from "framer-motion";
import { BLOCKER_OPTIONS } from "@/lib/constants";
import { BlockerType } from "@/types";

interface BlockerSelectProps {
  onSelect: (blocker: BlockerType) => void;
}

export default function BlockerSelect({ onSelect }: BlockerSelectProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.h2
        className="text-2xl font-bold text-center mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        What&apos;s holding you back?
      </motion.h2>
      <motion.p
        className="text-gray-400 text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Be honest — this helps me coach you better
      </motion.p>
      <div className="space-y-3">
        {BLOCKER_OPTIONS.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="w-full p-4 rounded-2xl bg-blue-900 border border-white hover:border-violet-500
                       text-left transition-colors cursor-pointer flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img className="w-18 h-18" src={option.image}></img>
            <div>
              <div className="font-semibold text-white">{option.label}</div>
              <div className="text-sm text-white">{option.description}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
