"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS = [15, 25, 50]; // minutes
const BREAK_DURATION = 5; // minutes

type TimerState = "idle" | "running" | "paused" | "break";

export default function PomodoroTimer() {
  const [presetIndex, setPresetIndex] = useState(1); // default 25 min
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[1] * 60);
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[1] * 60);
  const [state, setState] = useState<TimerState>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Tick
  useEffect(() => {
    if (state === "running" || state === "break") {
      clearTimer();
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            if (state === "running") {
              // Timer done — notify
              try { new Notification("Timer's up!", { body: "Take a break or keep going." }); } catch {}
              setState("idle");
            } else {
              // Break done — notify
              try { new Notification("Break's over!", { body: "Let's get back to it." }); } catch {}
              setState("idle");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [state, clearTimer]);

  const cyclePreset = () => {
    if (state !== "idle") return;
    const next = (presetIndex + 1) % PRESETS.length;
    setPresetIndex(next);
    setSecondsLeft(PRESETS[next] * 60);
    setTotalSeconds(PRESETS[next] * 60);
  };

  const start = () => {
    if (state === "idle") {
      setSecondsLeft(PRESETS[presetIndex] * 60);
      setTotalSeconds(PRESETS[presetIndex] * 60);
    }
    setState("running");
  };

  const pause = () => setState("paused");

  const resume = () => setState("running");

  const reset = () => {
    clearTimer();
    setState("idle");
    setSecondsLeft(PRESETS[presetIndex] * 60);
    setTotalSeconds(PRESETS[presetIndex] * 60);
  };

  const startBreak = () => {
    setSecondsLeft(BREAK_DURATION * 60);
    setTotalSeconds(BREAK_DURATION * 60);
    setState("break");
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;

  // SVG circle props
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circular timer */}
      <div className="relative w-32 h-32 cursor-pointer" onClick={state === "idle" ? cyclePreset : undefined}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="#b8d4ed"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={state === "break" ? "#10b981" : "#4a8fe7"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#1f3a5c] tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-[#5a7fa8] mt-0.5">
            {state === "idle" ? "tap to change" : state === "break" ? "break" : state === "paused" ? "paused" : "focus"}
          </span>
        </div>
      </div>

      {/* Preset pills (only show when idle) */}
      <AnimatePresence>
        {state === "idle" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2"
          >
            {PRESETS.map((p, i) => (
              <button
                key={p}
                onClick={() => {
                  setPresetIndex(i);
                  setSecondsLeft(p * 60);
                  setTotalSeconds(p * 60);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  i === presetIndex
                    ? "bg-[#4a8fe7] text-white"
                    : "bg-white/60 text-[#5a7fa8] hover:bg-white"
                }`}
              >
                {p}m
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-2">
        {state === "idle" && (
          <button
            onClick={start}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#4a8fe7] text-white hover:bg-[#3a7dd4] transition-all cursor-pointer"
          >
            Start Timer
          </button>
        )}
        {state === "running" && (
          <>
            <button
              onClick={pause}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/60 text-[#3a6a94] hover:bg-white transition-all cursor-pointer border border-[#b8d4ed]"
            >
              Pause
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#5a7fa8] hover:text-[#2e6dc0] transition-all cursor-pointer"
            >
              Reset
            </button>
          </>
        )}
        {state === "paused" && (
          <>
            <button
              onClick={resume}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#4a8fe7] text-white hover:bg-[#3a7dd4] transition-all cursor-pointer"
            >
              Resume
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#5a7fa8] hover:text-[#2e6dc0] transition-all cursor-pointer"
            >
              Reset
            </button>
          </>
        )}
        {state === "break" && (
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#5a7fa8] hover:text-[#2e6dc0] transition-all cursor-pointer"
          >
            Skip Break
          </button>
        )}
      </div>

      {/* After timer completes, show break option */}
      {state === "idle" && secondsLeft === 0 && totalSeconds > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startBreak}
          className="text-sm text-[#10b981] hover:text-[#059669] font-medium transition-colors cursor-pointer"
        >
          Take a 5-min break
        </motion.button>
      )}
    </div>
  );
}
