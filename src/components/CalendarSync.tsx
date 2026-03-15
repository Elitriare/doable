"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Step } from "@/types";

interface Props {
  taskTitle: string;
  steps: Step[];
  onEventIdsCreated: (ids: string[]) => void;
  existingEventIds?: string[];
}

export default function CalendarSync({ taskTitle, steps, onEventIdsCreated, existingEventIds }: Props) {
  const { data: session } = useSession();
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "rescheduling" | "rescheduled" | "error">("idle");

  const totalMinutes = steps.reduce((acc, s) => acc + s.estimatedMinutes, 0);
  const alreadySynced = existingEventIds && existingEventIds.length > 0;

  const handleAdd = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/calendar/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle, steps, startTime }),
      });
      if (!res.ok) throw new Error();
      const { eventIds } = await res.json();
      onEventIdsCreated(eventIds);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const handleReschedule = async () => {
    if (!existingEventIds) return;
    setStatus("rescheduling");
    try {
      let current = new Date(startTime);
      await Promise.all(
        steps.map(async (step, i) => {
          const start = current.toISOString();
          const end = new Date(current.getTime() + step.estimatedMinutes * 60000).toISOString();
          current = new Date(end);

          await fetch("/api/calendar/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId: existingEventIds[i],
              startTime: start,
              endTime: end,
              summary: `${taskTitle} — ${step.step}`,
            }),
          });
        })
      );
      setStatus("rescheduled");
    } catch {
      setStatus("error");
    }
  };

  if (!session) return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-violet-400 transition-colors cursor-pointer"
    >
      <span>📅</span>
      <span>Connect Google Calendar</span>
    </button>
  );

  if (status === "done" || status === "rescheduled") return (
    <div className="flex items-center gap-2 justify-center text-sm text-green-400">
      <span>✓</span>
      <span>{status === "done" ? `Added ${steps.length} events to Google Calendar` : "Events rescheduled"}</span>
    </div>
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span>📅</span>
        <p className="text-white text-sm font-medium">
          {alreadySynced ? "Reschedule in Google Calendar" : "Add to Google Calendar"}
        </p>
        <span className="text-gray-500 text-xs ml-auto">~{totalMinutes} min total</span>
      </div>
      <div className="flex gap-3 items-center">
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={alreadySynced ? handleReschedule : handleAdd}
          disabled={status === "loading" || status === "rescheduling"}
          className="py-2 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all disabled:opacity-40"
        >
          {status === "loading" || status === "rescheduling"
            ? "Saving..."
            : alreadySynced ? "Reschedule" : "Add"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-red-400 text-xs">Something went wrong. Try again.</p>
      )}
    </div>
  );
}