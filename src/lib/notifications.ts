let swRegistration: ServiceWorkerRegistration | null = null;
let comebackTimer: ReturnType<typeof setTimeout> | null = null;
let reminderPollInterval: ReturnType<typeof setInterval> | null = null;

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

// Subscribe to Web Push and save subscription to server
export async function subscribeToPush(): Promise<boolean> {
  if (!swRegistration || !("PushManager" in window)) return false;

  try {
    const permission = await requestNotificationPermission();
    if (!permission) return false;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    // Check for existing subscription
    let subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    // Save to server
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    return true;
  } catch {
    return false;
  }
}

// Check if push is currently subscribed
export async function isPushSubscribed(): Promise<boolean> {
  if (!swRegistration || !("PushManager" in window)) return false;
  try {
    const sub = await swRegistration.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

// Show a notification (client-side fallback)
async function showNotification(title: string, body: string, tag: string): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      tag,
      icon: "/images/B4.png",
      badge: "/images/B4.png",
    });
  } catch {
    try {
      new Notification(title, { body, tag });
    } catch {
      // All methods failed
    }
  }
}

// --- Comeback notification (client-side, tab must be open) ---

const COMEBACK_DELAY_MS = 15 * 60 * 1000; // 15 minutes

export function scheduleComebackNotification(taskTitle: string, progress: string): void {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;

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

// --- Streak warning ---

export async function scheduleStreakWarning(currentStreak: number): Promise<void> {
  if (typeof window === "undefined" || currentStreak < 2) return;
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const eightPm = new Date(now);
  eightPm.setHours(20, 0, 0, 0);
  if (now >= eightPm) return;

  const delay = eightPm.getTime() - now.getTime();

  setTimeout(() => {
    showNotification(
      `Your ${currentStreak}-day streak is at risk!`,
      "Complete a task before midnight to keep it going.",
      "streak-warning"
    );
  }, delay);
}

// --- Reminder polling (checks server for due reminders every 60s) ---

export function startReminderPolling(): void {
  if (reminderPollInterval) return;
  checkDueReminders();
  reminderPollInterval = setInterval(checkDueReminders, 60 * 1000);
}

export function stopReminderPolling(): void {
  if (reminderPollInterval) {
    clearInterval(reminderPollInterval);
    reminderPollInterval = null;
  }
}

async function checkDueReminders(): Promise<void> {
  try {
    await fetch("/api/reminders/check", { method: "POST" });
  } catch {
    // Silently fail
  }
}

// --- Helpers ---

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
