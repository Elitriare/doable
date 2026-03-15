import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

// POST — save or update push subscription for the current user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { subscription } = await req.json();
  if (!subscription || !subscription.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const db = await getDb();

  // Upsert subscription keyed by user email + endpoint
  await db.collection("push_subscriptions").updateOne(
    { userEmail: session.user.email, endpoint: subscription.endpoint },
    {
      $set: {
        userEmail: session.user.email,
        subscription,
        updatedAt: Date.now(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}

// DELETE — remove a push subscription
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { endpoint } = await req.json();
  if (!endpoint) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("push_subscriptions").deleteOne({
    userEmail: session.user.email,
    endpoint,
  });

  return NextResponse.json({ success: true });
}
