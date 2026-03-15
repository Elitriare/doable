"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getTasks } from "@/lib/storage";
import { Task } from "@/types";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  description: string;
}

interface DayData {
  date: Date;
  label: string;
  isToday: boolean;
  events: CalendarEvent[];
  tasks: Task[];
}

interface Props {
  onImport: (title: string) => void;
  onResume: (task: Task) => void;
  onForfeit: (task: Task) => void;
}

export default function CalendarTab({ onImport, onResume, onForfeit }: Props) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load tasks into state so forfeits update instantly
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalTasks(getTasks());
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError("");
    fetch("/api/calendar/pull")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load calendar");
        return r.json();
      })
      .then((d) => setEvents(d.events || []))
      .catch(() => setError("Couldn't load Google Calendar events"))
      .finally(() => setLoading(false));
  }, [session]);

  const handleForfeit = (task: Task) => {
    onForfeit(task);
    // Immediately remove from local state so UI updates without reload
    setLocalTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  // Build 7-day view
  const days: DayData[] = [];
  const now = new Date();
  const todayStr = now.toDateString();

  const allTasks = localTasks;

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateStr = date.toDateString();

    const dayEvents = events.filter((e) => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === dateStr;
    });

    const dayTasks = allTasks.filter((t) => {
      if (!t.createdAt) return false;
      const taskDate = new Date(t.createdAt);
      return taskDate.toDateString() === dateStr;
    });

    days.push({
      date,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString([], { weekday: "long" }),
      isToday: dateStr === todayStr,
      events: dayEvents,
      tasks: dayTasks,
    });
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#1f3a5c] mb-1">Your Week</h2>
        <p className="text-sm text-[#5a7fa8]">
          Plan your week and turn calendar events into coached sessions
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#4a8fe7] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-[#5a7fa8] text-sm">Loading calendar...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center mb-4">
          {error}
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {days.map((day) => {
            const hasContent = day.events.length > 0 || day.tasks.length > 0;

            return (
              <div key={day.date.toISOString()} className="relative">
                {/* Day header */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      day.isToday
                        ? "bg-[#4a8fe7] text-white shadow-md"
                        : "bg-white/60 text-[#5a7fa8] border border-[#b8d4ed]"
                    }`}
                  >
                    {day.date.getDate()}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${day.isToday ? "text-[#4a8fe7]" : "text-[#1f3a5c]"}`}>
                      {day.label}
                    </p>
                    <p className="text-xs text-[#5a7fa8]">{formatDate(day.date)}</p>
                  </div>
                </div>

                {/* Content */}
                {!hasContent && (
                  <div className="ml-[52px] py-3 px-4 rounded-xl border border-dashed border-[#b8d4ed] bg-white/30">
                    <p className="text-xs text-[#5a7fa8]">Nothing scheduled</p>
                  </div>
                )}

                {hasContent && (
                  <div className="ml-[52px] space-y-2">
                    {/* Google Calendar events */}
                    {day.events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between bg-white/70 border border-[#b8d4ed] rounded-xl px-4 py-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#e8f1fb] text-[#4a8fe7] font-medium shrink-0">
                              GCal
                            </span>
                            <p className="text-[#1f3a5c] text-sm font-medium truncate">
                              {event.title}
                            </p>
                          </div>
                          <p className="text-[#5a7fa8] text-xs mt-0.5 ml-[42px]">
                            {formatTime(event.start)}
                          </p>
                        </div>
                        <button
                          onClick={() => onImport(event.title)}
                          className="ml-3 shrink-0 text-xs py-1.5 px-3 rounded-xl font-bold text-white bg-[#4a8fe7] hover:bg-[#3a7dd4] transition-all cursor-pointer shadow-sm"
                        >
                          Coach me
                        </button>
                      </div>
                    ))}

                    {/* Doable tasks */}
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between bg-[#fef9ee] border border-[#fce7bd] rounded-xl px-4 py-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#fce7bd] text-[#1f3a5c] font-medium shrink-0">
                              Doable
                            </span>
                            <p className="text-[#1f3a5c] text-sm font-medium truncate">
                              {task.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 ml-[52px]">
                            {task.completed ? (
                              <span className="text-xs text-green-600 font-medium">Completed</span>
                            ) : (
                              <span className="text-xs text-[#5a7fa8]">
                                Step {task.currentStep + 1} of {task.steps.length}
                              </span>
                            )}
                          </div>
                        </div>
                        {!task.completed && (
                          <div className="ml-3 flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => onResume(task)}
                              className="text-xs py-1.5 px-3 rounded-xl font-bold text-[#4a8fe7] bg-white border border-[#b8d4ed] hover:bg-[#e8f1fb] transition-all cursor-pointer"
                            >
                              Resume
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Forfeit "${task.title}"? This can't be undone.`)) {
                                  handleForfeit(task);
                                }
                              }}
                              className="text-xs py-1.5 px-2.5 rounded-xl font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                              title="Forfeit task"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick add hint */}
      {!loading && (
        <div className="mt-8 text-center">
          <p className="text-xs text-[#5a7fa8]">
            Tap &quot;Coach me&quot; on any event to break it into doable steps
          </p>
        </div>
      )}
    </div>
  );
}
