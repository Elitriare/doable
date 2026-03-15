"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getCompletedTasks,
  getTotalStudyTime,
  getAverageTaskTime,
  getStreak,
  getStudyTimeByCategory,
  getBlockerDistribution,
  getActivityHeatmap,
} from "@/lib/storage";
import { Task } from "@/types";

const BLOCKER_LABELS: Record<string, string> = {
  "too-big": "Too Big",
  "too-boring": "Too Boring",
  "no-idea": "No Idea",
  "fear": "Fear",
  "low-energy": "Low Energy",
};

const PIE_COLORS = ["#8b5cf6", "#d946ef", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// --- Overview Cards ---
function OverviewCards({
  totalTasks,
  totalTime,
  avgTime,
  streak,
}: {
  totalTasks: number;
  totalTime: number;
  avgTime: number;
  streak: number;
}) {
  const cards = [
    { label: "Tasks Completed", value: totalTasks.toString() },
    { label: "Total Study Time", value: formatDuration(totalTime) },
    { label: "Avg Task Time", value: totalTasks > 0 ? formatDuration(avgTime) : "—" },
    { label: "Day Streak", value: streak > 0 ? `${streak}` : "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center border border-white/50"
        >
          <div className="text-2xl font-bold text-violet-600">{card.value}</div>
          <div className="text-xs text-gray-500 mt-1">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// --- Study Time by Category ---
function StudyTimeChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .map(([name, ms]) => ({ name, minutes: Math.round(ms / 60000) }))
    .sort((a, b) => b.minutes - a.minutes);

  if (chartData.length === 0) {
    return <EmptyState message="Complete some tasks to see study time by category" />;
  }

  return (
    <Section title="Study Time by Category">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={90} tick={{ fill: "#6b7280", fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${value} min`, "Time"]}
            contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 12 }}
          />
          <Bar dataKey="minutes" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Section>
  );
}

// --- Blocker Distribution ---
function BlockerChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([id, count]) => ({
    name: BLOCKER_LABELS[id] || id,
    value: count,
  }));

  if (chartData.length === 0) {
    return <EmptyState message="Complete some tasks to see your blocker patterns" />;
  }

  return (
    <Section title="Why You Procrastinate">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Section>
  );
}

// --- Activity Heatmap ---
function ActivityHeatmap({ data }: { data: Record<string, number> }) {
  // Show last 12 weeks (84 days)
  const weeks: { date: string; ms: number; dayOfWeek: number }[][] = [];
  const now = new Date();

  // Find the most recent Sunday to align the grid
  const startOffset = now.getDay();
  const gridStart = new Date(now);
  gridStart.setDate(gridStart.getDate() - startOffset - 83); // 12 weeks back

  let currentWeek: { date: string; ms: number; dayOfWeek: number }[] = [];
  for (let i = 0; i < 84 + startOffset + 1; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    if (d > now) break;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ date: key, ms: data[key] || 0, dayOfWeek });
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const maxMs = Math.max(...Object.values(data), 1);

  function getColor(ms: number): string {
    if (ms === 0) return "rgba(139, 92, 246, 0.08)";
    const intensity = Math.min(ms / maxMs, 1);
    const alpha = 0.2 + intensity * 0.8;
    return `rgba(139, 92, 246, ${alpha})`;
  }

  return (
    <Section title="Activity">
      <div className="flex gap-[3px] justify-center overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.ms > 0 ? formatDuration(day.ms) : "No activity"}`}
                className="rounded-sm"
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: getColor(day.ms),
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
          <div
            key={intensity}
            className="rounded-sm"
            style={{
              width: 10,
              height: 10,
              backgroundColor: intensity === 0
                ? "rgba(139, 92, 246, 0.08)"
                : `rgba(139, 92, 246, ${0.2 + intensity * 0.8})`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </Section>
  );
}

// --- Recent Sessions ---
function RecentSessions({ tasks }: { tasks: Task[] }) {
  const recent = tasks
    .filter((t) => t.completedAt)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 10);

  if (recent.length === 0) {
    return <EmptyState message="No completed sessions yet — go crush a task!" />;
  }

  return (
    <Section title="Recent Sessions">
      <div className="space-y-2">
        {recent.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-3 border border-white/50"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-800 truncate">{task.title}</div>
              <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span className="bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  {task.category || "Uncategorized"}
                </span>
                <span>{task.steps.length} steps</span>
                {task.startedAt && task.completedAt && (
                  <span>{formatDuration(task.completedAt - task.startedAt)}</span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-400 ml-3 whitespace-nowrap">
              {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ""}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// --- Helpers ---
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/50"
    >
      <h3 className="text-sm font-semibold text-gray-600 mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl p-8 border border-white/50 text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// --- Main Analytics Component ---
export default function Analytics() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const completedTasks = useMemo(() => (mounted ? getCompletedTasks() : []), [mounted]);
  const totalTime = useMemo(() => (mounted ? getTotalStudyTime() : 0), [mounted]);
  const avgTime = useMemo(() => (mounted ? getAverageTaskTime() : 0), [mounted]);
  const streak = useMemo(() => (mounted ? getStreak() : 0), [mounted]);
  const studyByCategory = useMemo(() => (mounted ? getStudyTimeByCategory() : {}), [mounted]);
  const blockerDist = useMemo(() => (mounted ? getBlockerDistribution() : {}), [mounted]);
  const heatmap = useMemo(() => (mounted ? getActivityHeatmap() : {}), [mounted]);

  if (!mounted) return null;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <motion.h2
        className="text-2xl font-bold text-center text-violet-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Your Progress
      </motion.h2>

      <OverviewCards
        totalTasks={completedTasks.length}
        totalTime={totalTime}
        avgTime={avgTime}
        streak={streak}
      />

      <StudyTimeChart data={studyByCategory} />
      <BlockerChart data={blockerDist} />
      <ActivityHeatmap data={heatmap} />
      <RecentSessions tasks={completedTasks} />
    </div>
  );
}
