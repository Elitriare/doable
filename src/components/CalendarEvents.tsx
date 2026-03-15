"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  description: string;
}

interface Props {
  onImport: (title: string) => void;
}

export default function CalendarEvents({ onImport }: Props) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch("/api/calendar/pull")
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-violet-400 transition-colors cursor-pointer mt-4"
    >
      <span>📅</span>
      <span>Import from Google Calendar</span>
    </button>
  );

  if (loading) return (
    <p className="text-center text-gray-500 text-sm mt-4">Loading your calendar...</p>
  );

  if (events.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
        From your calendar
      </p>
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{event.title}</p>
              <p className="text-gray-500 text-xs">
                {new Date(event.start).toLocaleDateString([], {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
            <button
              onClick={() => onImport(event.title)}
              className="ml-4 shrink-0 text-xs py-1.5 px-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
            >
              Coach me
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}