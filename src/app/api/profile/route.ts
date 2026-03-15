import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  let profile = await db
    .collection("profiles")
    .findOne({ userEmail: session.user.email });

  // Auto-create profile with compete fields on first access
  if (!profile) {
    const newProfile = {
      userEmail: session.user.email,
      rewards: [],
      points: 0,
      friendCode: crypto.randomUUID().slice(0, 6).toUpperCase(),
      displayName: session.user.name || "Anonymous",
      avatarUrl: session.user.image || "",
      friends: [],
      pointsHistory: [],
    };
    await db.collection("profiles").insertOne(newProfile);
    const { userEmail, ...cleaned } = newProfile;
    return NextResponse.json({ profile: cleaned });
  }

  // Backfill missing compete fields for existing profiles
  const updates: Record<string, any> = {};
  if (!profile.friendCode) updates.friendCode = crypto.randomUUID().slice(0, 6).toUpperCase();
  if (profile.points === undefined) updates.points = 0;
  if (!profile.displayName) updates.displayName = session.user.name || "Anonymous";
  if (!profile.avatarUrl) updates.avatarUrl = session.user.image || "";
  if (!profile.friends) updates.friends = [];
  if (!profile.pointsHistory) updates.pointsHistory = [];

  if (Object.keys(updates).length > 0) {
    await db.collection("profiles").updateOne(
      { userEmail: session.user.email },
      { $set: updates }
    );
    profile = { ...profile, ...updates };
  }

  const { _id, userEmail, ...cleaned } = profile;
  return NextResponse.json({ profile: cleaned });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { profile } = await req.json();

  const db = await getDb();
  await db.collection("profiles").updateOne(
    { userEmail: session.user.email },
    {
      $set: { ...profile, userEmail: session.user.email },
      $setOnInsert: {
        points: 0,
        friendCode: crypto.randomUUID().slice(0, 6).toUpperCase(),
        displayName: session.user.name || "Anonymous",
        avatarUrl: session.user.image || "",
        friends: [],
        pointsHistory: [],
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
