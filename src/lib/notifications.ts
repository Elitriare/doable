let swRegistration: ServiceWorkerRegistration | null = null;
let comebackTimer: ReturnType<typeof setTimeout> | null = null;
const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js");
    if (!swRegistration.active) {
      await navigator.serviceWorker.ready;
    }
  } catch {
    // SW registration failed silently
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

async function showNotification(title: string, body: string, tag: string): Promise<void> {
  // Try basic Notification API first — most reliable on macOS Chrome
  try {
    new Notification(title, { body, tag });
    return;
  } catch {
    // Fallback to service worker notification
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, tag });
  } catch {
    // All notification methods failed
  }
}

const COMEBACK_DELAY_MS = 15 * 60 * 1000; // 15 minutes

export function scheduleComebackNotification(taskTitle: string, progress: string): void {
  if (Notification.permission !== "granted") return;

  cancelComebackNotification();
  comebackTimer = setTimeout(() => {
    showNotification(
      "Don't leave it hanging!",
      `You were ${progress} through "${taskTitle}" — come back and finish!`,
      "comeback"
    );
    comebackTimer = null;
  }, COMEBACK_DELAY_MS);
}

export function cancelComebackNotification(): void {
  if (comebackTimer) {
    clearTimeout(comebackTimer);
    comebackTimer = null;
  }
}

export function scheduleTaskNotification(id: string, title: string, triggerAt: number): void {
  if (Notification.permission !== "granted") return;

  const delay = triggerAt - Date.now();
  if (delay <= 0) return;

  // Clear existing timer for this id if any
  const existing = scheduledTimers.get(id);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    showNotification(
      "Time to get it done!",
      `You said you'd start "${title}" now. Let's make it doable.`,
      `scheduled-${id}`
    );
    scheduledTimers.delete(id);
  }, delay);

  scheduledTimers.set(id, timer);
}

// Schedule a streak-loss warning notification for 8pm if user hasn't completed a task today
let streakTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleStreakWarning(currentStreak: number): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted" || currentStreak < 2) return;
  if (streakTimer) clearTimeout(streakTimer);

  const now = new Date();
  const eightPm = new Date(now);
  eightPm.setHours(20, 0, 0, 0);

  // If it's already past 8pm, don't schedule
  if (now >= eightPm) return;

  const delay = eightPm.getTime() - now.getTime();

  streakTimer = setTimeout(() => {
    showNotification(
      `Your ${currentStreak}-day streak is at risk!`,
      "Complete a task before midnight to keep it going.",
      "streak-warning"
    );
    streakTimer = null;
  }, delay);
}

