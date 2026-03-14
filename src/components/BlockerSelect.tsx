"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BLOCKER_OPTIONS } from "@/lib/constants";
import { BlockerType } from "@/types";

const EXTRA_OPTIONS = [
  { id: "no-time", label: "I don't have enough time", image: "/images/outoftime.png", description: "Too much on my plate and not enough hours in the day" },
  { id: "waiting-on-others", label: "I'm waiting on someone else", image: "/images/waiting.png", description: "I'm blocked by another person and can't move forward alone" },
  { id: "unclear-goal", label: "The goal isn't clear", image: "/images/notclear.png", description: "I'm not sure what done actually looks like" },
  { id: "perfectionism", label: "I want it to be perfect", image: "/images/perfect.png", description: "I keep putting it off because I want to do it perfectly" },
  { id: "distracted", label: "I keep getting distracted", image: "/images/distracted.png", description: "Something always pulls my attention away before I can focus" },
  { id: "no-resources", label: "I'm missing tools or resources", image: "/images/missing.png", description: "I don't have what I need to get started or finish" },
  { id: "burnt-out", label: "I'm burnt out", image: "/images/burnout.png", description: "I've been pushing hard and have nothing left in the tank" },
];

interface BlockerSelectProps {
  onSelect: (blocker: BlockerType) => void;
}

export default function BlockerSelect({ onSelect }: BlockerSelectProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customReason, setCustomReason] = useState("");

  const allOptions = [...BLOCKER_OPTIONS, ...EXTRA_OPTIONS];

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
        {allOptions.map((option, index) => (
          <motion.button
            key={option.id}

            onClick={() => onSelect(option.id as BlockerType)}
            className="w-full p-4 rounded-2xl bg-blue-900 border border-white hover:border-violet-500
                       text-left transition-colors cursor-pointer flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
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

        {/* Custom reason option */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: allOptions.length * 0.05 }}
        >
          <button
            onClick={() => setShowCustom((v) => !v)}
            className={`w-full p-4 rounded-2xl border text-left transition-colors cursor-pointer flex items-center gap-4
              ${showCustom
                ? "bg-blue-900 border-white"
                : "bg-blue-900 border-white hover:border-violet-500"
              }`}
          >
            <span className="text-3xl">💬</span>
            <div>
              <div className="font-semibold text-white">Something else</div>
              <div className="text-sm text-gray-400">My reason isn&apos;t listed — I&apos;ll explain it myself</div>
            </div>
          </button>

          <AnimatePresence>
            {showCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 px-1 space-y-3">
                  <textarea
                    autoFocus
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe what's making this task difficult for you..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-white border border-gray-700 text-black text-sm
                               placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <motion.button
                    onClick={() => {
                      if (customReason.trim()) onSelect("too-big" as BlockerType);
                    }}
                    disabled={!customReason.trim()}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed
                               bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                    whileHover={{ scale: customReason.trim() ? 1.02 : 1 }}
                    whileTap={{ scale: customReason.trim() ? 0.98 : 1 }}
                  >
                    Let&apos;s tackle it →
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}