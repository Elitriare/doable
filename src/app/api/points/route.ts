import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import crypto from "crypto";

// Allowed point deltas to prevent abuse
const VALID_REASONS = ["step_complete", "task_complete", "streak_bonus", "first_today", "forfeit"];
const MAX_DELTA = 50;
const MIN_DELTA = -50;

// POST — award or deduct points
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { delta, reason, taskTitle } = await req.json();
  if (typeof delta !== "number" || !reason) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate reason and clamp delta to prevent abuse
  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }
  const clampedDelta = Math.max(MIN_DELTA, Math.min(MAX_DELTA, Math.round(delta)));
  const safeTitle = typeof taskTitle === "string" ? taskTitle.slice(0, 200) : "";

  const db = await getDb();

  // Ensure profile exists with points field
  await db.collection("profiles").updateOne(
    { userEmail: session.user.email },
    {
      $setOnInsert: {
        userEmail: session.user.email,
        points: 0,
        friendCode: crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 6),
        displayName: session.user.name || "Anonymous",
        avatarUrl: session.user.image || "",
        friends: [],
        pointsHistory: [],
        rewards: [],
      },
    },
    { upsert: true }
  );

  // Update points (floor at 0) and push to history
  const result = await db.collection("profiles").findOneAndUpdate(
    { userEmail: session.user.email },
    {
      $inc: { points: clampedDelta },
      $push: {
        pointsHistory: {
          $each: [{ delta: clampedDelta, reason, taskTitle: safeTitle, timestamp: Date.now() }],
          $slice: -50, // keep last 50 entries
        },
      } as any,
    },
    { returnDocument: "after" }
  );

  // Floor points at 0
  const newPoints = result?.points ?? 0;
  if (newPoints < 0) {
    await db.collection("profiles").updateOne(
      { userEmail: session.user.email },
      { $set: { points: 0 } }
    );
    return NextResponse.json({ success: true, points: 0 });
  }

  return NextResponse.json({ success: true, points: newPoints });
}
