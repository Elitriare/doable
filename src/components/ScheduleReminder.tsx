"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/notifications";

interface Reminder {
  id: string;
  taskName: string;
  triggerAt: number;
  sent: boolean;
}

export default function ScheduleReminder() {
  const [open, setOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState("");

  // Fetch existing reminders when opened
  useEffect(() => {
    if (!open) return;
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((data) => setReminders(data.reminders || []))
      .catch(() => {});
  }, [open, confirmed]);

  const presets = [
    { label: "In 30 min", minutes: 30 },
    { label: "In 1 hour", minutes: 60 },
    { label: "In 2 hours", minutes: 120 },
    { label: "Tomorrow 9am", minutes: -1 },
  ];

  const getPresetTime = (minutes: number): number => {
    if (minutes === -1) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.getTime();
    }
    return Date.now() + minutes * 60 * 1000;
  };

  const getCustomTriggerTime = (): number | null => {
    if (!customTime) return null;
    const [hours, minutes] = customTime.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    if (d.getTime() <= Date.now()) {
      d.setDate(d.getDate() + 1);
    }
    return d.getTime();
  };

  const handleSchedule = async () => {
    if (!taskName.trim()) return;

    let triggerAt: number | null = null;
    if (selectedPreset !== null) {
      const preset = presets.find((p) => p.label === selectedPreset);
      if (preset) triggerAt = getPresetTime(preset.minutes);
    } else {
      triggerAt = getCustomTriggerTime();
    }

    if (!triggerAt) {
      setError("Pick a time");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setError("Please enable notifications in your browser settings.");
        setSaving(false);
        return;
      }
      await subscribeToPush();

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: taskName.trim(), triggerAt }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set reminder");
        setSaving(false);
        return;
      }

      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        setTaskName("");
        setSelectedPreset(null);
        setCustomTime("");
      }, 2500);
    } catch {
      setError("Something went wrong");
    }
    setSaving(false);
  };

  const handleCancel = async (id: string) => {
    try {
      await fetch("/api/reminders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`;
  };

  const activeReminders = reminders.filter((r) => !r.sent && r.triggerAt > Date.now());

  return (
    <div className="mt-6 w-full max-w-lg mx-auto">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-[#5a7fa8] hover:text-[#2e6dc0] transition-colors cursor-pointer flex items-center gap-2 mx-auto"
      >
        <span className="text-base">🔔</span>
        <span>{open ? "Close reminders" : "Set a reminder"}</span>
        {activeReminders.length > 0 && !open && (
          <span className="bg-[#4a8fe7] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {activeReminders.length}
          </span>
        )}
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
            <div className="mt-4 bg-white/70 backdrop-blur border border-[#b8d4ed] rounded-2xl p-5 space-y-4">
              {confirmed ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-4"
                >
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-sm font-semibold text-[#1f3a5c]">
                    Reminder set!
                  </p>
                  <p className="text-xs text-[#5a7fa8] mt-1">
                    We&apos;ll notify you even if the app is closed.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Task name */}
                  <div>
                    <label className="text-xs font-semibold text-[#1f3a5c] mb-1.5 block">
                      What do you need to do?
                    </label>
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder="e.g. Start math homework"
                      maxLength={200}
                      className="w-full bg-white border border-[#b8d4ed] rounded-xl px-4 py-2.5 text-[#1f3a5c] text-sm placeholder:text-[#5a7fa8] focus:outline-none focus:ring-2 focus:ring-[#4a8fe7]/30"
                    />
                  </div>

                  {/* Quick presets */}
                  <div>
                    <label className="text-xs font-semibold text-[#1f3a5c] mb-1.5 block">
                      When?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {presets.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => {
                            setSelectedPreset(selectedPreset === p.label ? null : p.label);
                            setCustomTime("");
                            setError("");
                          }}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                            selectedPreset === p.label
                              ? "bg-[#4a8fe7] text-white border-[#4a8fe7]"
                              : "bg-white text-[#1f3a5c] border-[#b8d4ed] hover:border-[#4a8fe7]"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom time */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#5a7fa8]">or pick a time:</span>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => {
                        setCustomTime(e.target.value);
                        setSelectedPreset(null);
                        setError("");
                      }}
                      className="flex-1 bg-white border border-[#b8d4ed] rounded-xl px-3 py-2 text-[#1f3a5c] text-sm focus:outline-none focus:ring-2 focus:ring-[#4a8fe7]/30"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-500">{error}</p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSchedule}
                    disabled={!taskName.trim() || (!selectedPreset && !customTime) || saving}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#4a8fe7] hover:bg-[#3a7dd4] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {saving ? "Setting..." : "Set Reminder"}
                  </button>
                </>
              )}

              {/* Active reminders list */}
              {activeReminders.length > 0 && (
                <div className="border-t border-[#b8d4ed] pt-3 mt-3">
                  <p className="text-xs font-semibold text-[#1f3a5c] mb-2">
                    Upcoming reminders
                  </p>
                  <div className="space-y-2">
                    {activeReminders.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-[#b8d4ed]/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1f3a5c] truncate">
                            {r.taskName}
                          </p>
                          <p className="text-xs text-[#5a7fa8]">
                            {formatTime(r.triggerAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancel(r.id)}
                          className="text-[#5a7fa8] hover:text-red-500 transition-colors cursor-pointer ml-2 shrink-0 text-lg"
                          title="Cancel reminder"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
