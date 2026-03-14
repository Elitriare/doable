"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  requestNotificationPermission,
  scheduleTaskNotification,
} from "@/lib/notifications";

export default function ScheduleReminder() {
  const [open, setOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [time, setTime] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleSchedule = async () => {
    if (!taskName.trim() || !time) return;

    const granted = await requestNotificationPermission();
    if (!granted) {
      alert("Please enable notifications to use reminders.");
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);

    // If the time is in the past, schedule for tomorrow
    if (triggerDate.getTime() <= Date.now()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const id = crypto.randomUUID();
    scheduleTaskNotification(id, taskName.trim(), triggerDate.getTime());

    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      setOpen(false);
      setTaskName("");
      setTime("");
    }, 2000);
  };

  return (
    <div className="mt-8 w-full max-w-lg mx-auto">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-500 hover:text-violet-400 transition-colors cursor-pointer flex items-center gap-2 mx-auto"
      >
        <span>⏰</span>
        <span>Schedule a reminder to start a task</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              {confirmed ? (
                <motion.p
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center text-green-400 font-medium py-2"
                >
                  Reminder set! We&apos;ll nudge you when it&apos;s time.
                </motion.p>
              ) : (
                <>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="What task do you need to do?"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <div className="flex gap-3">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
                    />
                    <button
                      onClick={handleSchedule}
                      disabled={!taskName.trim() || !time}
                      className="px-6 py-3 rounded-xl font-semibold text-white
                                 bg-gradient-to-r from-violet-500 to-fuchsia-500
                                 hover:from-violet-600 hover:to-fuchsia-600
                                 disabled:opacity-40 disabled:cursor-not-allowed
                                 transition-all cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
