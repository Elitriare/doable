"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JournalEntryData } from "@/types";

interface Props {
  entries: JournalEntryData[];
}

export default function JournalDrawer({ entries }: Props) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"left" | "right">("right");

  if (entries.length === 0) return null;

  const toggleSide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSide(s => s === "right" ? "left" : "right");
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-violet-400 transition-colors cursor-pointer"
      >
        <span>📖</span>
        <span>{entries.length} journal {entries.length === 1 ? "entry" : "entries"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              className={`fixed top-0 bottom-0 z-50 w-80 bg-gray-950 border-gray-800 flex flex-col
                ${side === "right" ? "right-0 border-l rounded-l-3xl" : "left-0 border-r rounded-r-3xl"}`}
              initial={{ x: side === "right" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: side === "right" ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-gray-800 shrink-0">
                <h2 className="text-white font-semibold">Your journey</h2>
                <div className="flex items-center gap-2">
                  {/* Side toggle */}
                  <button
                    onClick={toggleSide}
                    title={`Move to ${side === "right" ? "left" : "right"}`}
                    className="text-gray-500 hover:text-violet-400 transition-colors text-lg leading-none px-1"
                  >
                    {side === "right" ? "◀" : "▶"}
                  </button>
                  {/* Close */}
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Entries */}
              <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
                {entries.map((entry, i) => (
                  <motion.div
                    key={i}
                    className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {/* Photo */}
                    <img
                      src={entry.photo}
                      alt={`Step ${i + 1}`}
                      className="w-full h-32 object-cover"
                    />

                    <div className="p-3">
                      {/* Step label */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                          <span className="text-violet-400 text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-gray-500 text-xs truncate">{entry.stepText}</p>
                      </div>

                      {/* Caption */}
                      <p className="text-gray-300 text-xs italic mb-2">"{entry.caption}"</p>

                      {/* Reflection */}
                      <p className="text-violet-300 text-xs leading-relaxed">{entry.reflection}</p>

                      {/* Time */}
                      <p className="text-gray-600 text-xs mt-2">
                        {new Date(entry.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}