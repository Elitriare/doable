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
}

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return { rewards: DEFAULT_REWARDS };
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : { rewards: DEFAULT_REWARDS };
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getRandomReward(): string {
  const profile = getProfile();
  const rewards = profile.rewards.length > 0 ? profile.rewards : DEFAULT_REWARDS;
  return rewards[Math.floor(Math.random() * rewards.length)];
}
