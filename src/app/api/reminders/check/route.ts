import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import webPush from "web-push";

webPush.setVapidDetails(
  "mailto:doable@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// POST — check for due reminders and send push notifications
// This can be called by Vercel Cron or a client-side poll
export async function POST(req: NextRequest) {
  // Simple auth: check for a secret header or allow from same origin
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow if called with cron secret, or if no cron secret is set (dev mode)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const now = Date.now();

  // Find all due, unsent reminders
  const dueReminders = await db
    .collection("reminders")
    .find({ triggerAt: { $lte: now }, sent: false })
    .limit(50)
    .toArray();

  if (dueReminders.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let sent = 0;

  for (const reminder of dueReminders) {
    // Get all push subscriptions for this user
    const subs = await db
      .collection("push_subscriptions")
      .find({ userEmail: reminder.userEmail })
      .toArray();

    const payload = JSON.stringify({
      title: "Time to get it done!",
      body: `You said you'd start "${reminder.taskName}" now. Let's make it doable.`,
      tag: `reminder-${reminder._id}`,
    });

    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.collection("push_subscriptions").deleteOne({ _id: sub._id });
        }
      }
    }

    // Mark reminder as sent
    await db.collection("reminders").updateOne(
      { _id: reminder._id },
      { $set: { sent: true, sentAt: now } }
    );
  }

  return NextResponse.json({ processed: dueReminders.length, sent });
}
