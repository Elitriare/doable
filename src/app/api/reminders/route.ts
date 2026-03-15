import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

// GET — fetch user's upcoming reminders
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  const reminders = await db
    .collection("reminders")
    .find({ userEmail: session.user.email, triggerAt: { $gt: Date.now() - 60000 } })
    .sort({ triggerAt: 1 })
    .limit(20)
    .toArray();

  const cleaned = reminders.map(({ _id, userEmail, ...r }) => ({
    ...r,
    id: _id.toString(),
  }));

  return NextResponse.json({ reminders: cleaned });
}

// POST — create a new reminder
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { taskName, triggerAt } = await req.json();

  if (!taskName || typeof taskName !== "string" || taskName.trim().length === 0) {
    return NextResponse.json({ error: "Task name is required" }, { status: 400 });
  }

  if (!triggerAt || typeof triggerAt !== "number" || triggerAt <= Date.now()) {
    return NextResponse.json({ error: "Trigger time must be in the future" }, { status: 400 });
  }

  // Don't allow reminders more than 7 days out
  if (triggerAt > Date.now() + 7 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "Reminders can't be more than 7 days away" }, { status: 400 });
  }

  const db = await getDb();

  // Limit to 10 active reminders per user
  const count = await db
    .collection("reminders")
    .countDocuments({ userEmail: session.user.email, triggerAt: { $gt: Date.now() } });

  if (count >= 10) {
    return NextResponse.json({ error: "Maximum 10 active reminders" }, { status: 400 });
  }

  const reminder = {
    userEmail: session.user.email,
    taskName: taskName.trim().slice(0, 200),
    triggerAt,
    sent: false,
    createdAt: Date.now(),
  };

  const result = await db.collection("reminders").insertOne(reminder);

  return NextResponse.json({
    success: true,
    reminder: { ...reminder, id: result.insertedId.toString() },
  });
}

// DELETE — cancel a reminder
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Reminder ID required" }, { status: 400 });
  }

  const db = await getDb();
  const { ObjectId } = await import("mongodb");

  await db.collection("reminders").deleteOne({
    _id: new ObjectId(id),
    userEmail: session.user.email,
  });

  return NextResponse.json({ success: true });
}
