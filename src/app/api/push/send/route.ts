import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import webPush from "web-push";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID keys not configured");
  webPush.setVapidDetails("mailto:doable@example.com", pub, priv);
  vapidConfigured = true;
}

// POST — send a push notification to the current user's devices
export async function POST(req: NextRequest) {
  try { ensureVapid(); } catch {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title, body, tag } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  const db = await getDb();
  const subs = await db
    .collection("push_subscriptions")
    .find({ userEmail: session.user.email })
    .toArray();

  if (subs.length === 0) {
    return NextResponse.json({ error: "No push subscriptions found" }, { status: 404 });
  }

  const payload = JSON.stringify({
    title: String(title).slice(0, 200),
    body: String(body).slice(0, 500),
    tag: tag || "doable",
  });

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(sub.subscription, payload);
      } catch (err: any) {
        // 410 = subscription expired, clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.collection("push_subscriptions").deleteOne({ _id: sub._id });
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ success: true, sent });
}
