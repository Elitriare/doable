import { Task, UserProfile } from "@/types";
import { DEFAULT_REWARDS } from "./constants";

const TASKS_KEY = "doable_tasks";
const PROFILE_KEY = "doable_profile";

export function getTasks(): Task[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(TASKS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTask(task: Task): void {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

  // Fire-and-forget sync to MongoDB if logged in
  syncTaskToDb(task);
}

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return { rewards: DEFAULT_REWARDS };
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : { rewards: DEFAULT_REWARDS };
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  // Fire-and-forget sync to MongoDB
  syncProfileToDb(profile);
}

// --- DB sync helpers (fire-and-forget, won't block UI) ---

function syncTaskToDb(task: Task): void {
  fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task }),
  }).catch(() => {}); // silently fail if not logged in or network error
}

function syncProfileToDb(profile: UserProfile): void {
  fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  }).catch(() => {});
}

// Pull all tasks from DB and merge with localStorage (DB wins on conflicts)
export async function pullTasksFromDb(): Promise<Task[]> {
  try {
    const res = await fetch("/api/tasks");
    if (!res.ok) return getTasks();
    const { tasks: dbTasks } = await res.json();

    if (!dbTasks || dbTasks.length === 0) return getTasks();

    // Merge: DB tasks take priority, keep any local-only tasks
    const localTasks = getTasks();
    const dbTaskIds = new Set(dbTasks.map((t: Task) => t.id));
    const localOnly = localTasks.filter((t) => !dbTaskIds.has(t.id));
    const merged = [...dbTasks, ...localOnly];

    localStorage.setItem(TASKS_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return getTasks();
  }
}

// Push all localStorage tasks to DB (first login migration)
export async function pushAllTasksToDb(): Promise<void> {
  const tasks = getTasks();
  if (tasks.length === 0) return;
  try {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });
  } catch {}
}

export function deleteTask(taskId: string): void {
  const tasks = getTasks().filter((t) => t.id !== taskId);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

  // Fire-and-forget delete from MongoDB
  fetch("/api/tasks", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId }),
  }).catch(() => {});
}

export function getRandomReward(): string {
  const profile = getProfile();
  const rewards = profile.rewards.length > 0 ? profile.rewards : DEFAULT_REWARDS;
  return rewards[Math.floor(Math.random() * rewards.length)];
}

export function getActiveTask(): Task | null {
  const tasks = getTasks();
  return tasks.find((t) => !t.completed && t.startedAt) || null;
}

// --- Analytics helpers ---

export function getCompletedTasks(): Task[] {
  return getTasks().filter((t) => t.completed && t.completedAt);
}

export function getTaskActiveTime(task: Task): number {
  if (!task.startedAt || !task.completedAt) return 0;
  // Use journal entries to compute active time between steps
  const IDLE_THRESHOLD = 5 * 60 * 1000;
  let activeTime = 0;

  if (task.journal && task.journal.length > 0) {
    let prevTime = task.startedAt;
    for (const entry of task.journal) {
      const gap = entry.completedAt - prevTime;
      activeTime += gap > IDLE_THRESHOLD ? IDLE_THRESHOLD : gap;
      prevTime = entry.completedAt;
    }
  }

  // Fallback: if no journal entries, use total time capped at reasonable amount
  if (activeTime === 0) {
    const total = task.completedAt - task.startedAt;
    activeTime = Math.min(total, 60 * 60 * 1000); // cap at 1hr
  }
  return activeTime;
}

export function getStudyTimeByCategory(): Record<string, number> {
  const completed = getCompletedTasks();
  const byCategory: Record<string, number> = {};
  for (const task of completed) {
    const cat = task.category || "Uncategorized";
    byCategory[cat] = (byCategory[cat] || 0) + getTaskActiveTime(task);
  }
  return byCategory;
}

export function getBlockerDistribution(): Record<string, number> {
  const completed = getCompletedTasks();
  const dist: Record<string, number> = {};
  for (const task of completed) {
    dist[task.blocker] = (dist[task.blocker] || 0) + 1;
  }
  return dist;
}

export function getStreak(): number {
  const completed = getCompletedTasks();
  if (completed.length === 0) return 0;

  const days = new Set(
    completed.map((t) => {
      const d = new Date(t.completedAt!);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    // Allow today to not have a task yet (i === 0)
  }
  return streak;
}

export function getActivityHeatmap(): Record<string, number> {
  const completed = getCompletedTasks();
  const heatmap: Record<string, number> = {};
  for (const task of completed) {
    const d = new Date(task.completedAt!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    heatmap[key] = (heatmap[key] || 0) + getTaskActiveTime(task);
  }
  return heatmap;
}

export function getTotalStudyTime(): number {
  return getCompletedTasks().reduce((sum, t) => sum + getTaskActiveTime(t), 0);
}

export function getAverageTaskTime(): number {
  const completed = getCompletedTasks();
  if (completed.length === 0) return 0;
  return getTotalStudyTime() / completed.length;
}
