import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

// GET — fetch all tasks for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  const tasks = await db
    .collection("tasks")
    .find({ userEmail: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  // Strip MongoDB _id for client compatibility
  const cleaned = tasks.map(({ _id, userEmail, ...task }) => task);

  return NextResponse.json({ tasks: cleaned });
}

// POST — save/upsert a task for the logged-in user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { task } = await req.json();
  if (!task?.id) {
    return NextResponse.json({ error: "Invalid task" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("tasks").updateOne(
    { id: task.id, userEmail: session.user.email },
    { $set: { ...task, userEmail: session.user.email } },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}

// PUT — bulk sync (push all local tasks to DB on first login)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { tasks } = await req.json();
  if (!Array.isArray(tasks)) {
    return NextResponse.json({ error: "Invalid tasks" }, { status: 400 });
  }

  const db = await getDb();
  const ops = tasks.map((task: any) => ({
    updateOne: {
      filter: { id: task.id, userEmail: session.user!.email },
      update: { $set: { ...task, userEmail: session.user!.email } },
      upsert: true,
    },
  }));

  if (ops.length > 0) {
    await db.collection("tasks").bulkWrite(ops);
  }

  return NextResponse.json({ success: true, synced: ops.length });
}
