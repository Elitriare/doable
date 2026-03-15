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
        className="flex items-center gap-2 mx-auto text-sm text-[#5a7fa8] hover:text-[#2e6dc0] transition-colors cursor-pointer"
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
              className={`fixed top-0 bottom-0 z-50 w-80 bg-[#e8f0f8] border-[#b8d4ed] flex flex-col
                ${side === "right" ? "right-0 border-l rounded-l-3xl" : "left-0 border-r rounded-r-3xl"}`}
              initial={{ x: side === "right" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: side === "right" ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-[#b8d4ed] shrink-0">
                <h2 className="text-[#1f3a5c] font-semibold">Your journey</h2>
                <div className="flex items-center gap-2">
                  {/* Side toggle */}
                  <button
                    onClick={toggleSide}
                    title={`Move to ${side === "right" ? "left" : "right"}`}
                    className="text-[#5a7fa8] hover:text-[#2e6dc0] transition-colors text-lg leading-none px-1"
                  >
                    {side === "right" ? "◀" : "▶"}
                  </button>
                  {/* Close */}
                  <button
                    onClick={() => setOpen(false)}
                    className="text-[#5a7fa8] hover:text-[#1f3a5c] transition-colors text-sm"
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
                    className="bg-white/70 border border-[#b8d4ed] rounded-2xl overflow-hidden"
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
                        <div className="w-4 h-4 rounded-full bg-[#4a8fe7]/20 border border-[#4a8fe7]/40 flex items-center justify-center shrink-0">
                          <span className="text-[#2e6dc0] text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-[#5a7fa8] text-xs truncate">{entry.stepText}</p>
                      </div>

                      {/* Caption */}
                      <p className="text-[#3a6a94] text-xs italic mb-2">"{entry.caption}"</p>

                      {/* Reflection */}
                      <p className="text-[#2e6dc0] text-xs leading-relaxed">{entry.reflection}</p>

                      {/* Time */}
                      <p className="text-[#5a7fa8] text-xs mt-2">
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