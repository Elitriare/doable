import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

// Generate a simple 6-char code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET — fetch leaderboard (self + friends with points)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await getDb();
    const existing = await db.collection("profiles").findOne({ userEmail: session.user.email });

    // Auto-create profile if it doesn't exist
    let p: any;
    if (!existing) {
      p = {
        userEmail: session.user.email,
        rewards: [],
        points: 0,
        friendCode: generateCode(),
        displayName: session.user.name || "Anonymous",
        avatarUrl: session.user.image || "",
        friends: [],
        pointsHistory: [],
      };
      await db.collection("profiles").insertOne(p);
    } else {
      p = existing;
    }

    // Backfill friendCode if missing on older profiles
    if (!p.friendCode) {
      const code = generateCode();
      await db.collection("profiles").updateOne(
        { userEmail: session.user.email },
        { $set: { friendCode: code, points: p.points || 0, friends: p.friends || [], pointsHistory: p.pointsHistory || [] } }
      );
      p.friendCode = code;
    }

    const friendEmails: string[] = p.friends || [];

    // Fetch friends' profiles
    let friendProfiles: any[] = [];
    if (friendEmails.length > 0) {
      friendProfiles = await db
        .collection("profiles")
        .find({ userEmail: { $in: friendEmails } })
        .project({ displayName: 1, avatarUrl: 1, points: 1, userEmail: 1, _id: 0 })
        .toArray();
    }

    // Build leaderboard including self
    const leaderboard = [
      {
        displayName: p.displayName || session.user.name || "You",
        avatarUrl: p.avatarUrl || session.user.image || "",
        points: p.points || 0,
        isYou: true,
      },
      ...friendProfiles.map((f: any) => ({
        displayName: f.displayName || "Friend",
        avatarUrl: f.avatarUrl || "",
        points: f.points || 0,
        isYou: false,
      })),
    ].sort((a, b) => b.points - a.points);

    return NextResponse.json({
      leaderboard,
      friendCode: p.friendCode || "",
      points: p.points || 0,
      pointsHistory: p.pointsHistory || [],
    });
  } catch (err) {
    console.error("Friends API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST — add or remove friend
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { action, friendCode } = await req.json();

  const db = await getDb();

  if (action === "add") {
    if (!friendCode || typeof friendCode !== "string") {
      return NextResponse.json({ error: "Invalid friend code" }, { status: 400 });
    }

    const code = friendCode.trim().toUpperCase();

    // Find friend by code
    const friendProfile = await db.collection("profiles").findOne({ friendCode: code });
    if (!friendProfile) {
      return NextResponse.json({ error: "No user found with that code" }, { status: 404 });
    }

    if (friendProfile.userEmail === session.user.email) {
      return NextResponse.json({ error: "That's your own code!" }, { status: 400 });
    }

    // Check if already friends
    const profile = await db.collection("profiles").findOne({ userEmail: session.user.email });
    if (profile?.friends?.includes(friendProfile.userEmail)) {
      return NextResponse.json({ error: "Already friends!" }, { status: 400 });
    }

    // Bidirectional: add each other
    await db.collection("profiles").updateOne(
      { userEmail: session.user.email },
      { $addToSet: { friends: friendProfile.userEmail } }
    );
    await db.collection("profiles").updateOne(
      { userEmail: friendProfile.userEmail },
      { $addToSet: { friends: session.user.email } }
    );

    return NextResponse.json({
      success: true,
      friend: {
        displayName: friendProfile.displayName || "Friend",
        avatarUrl: friendProfile.avatarUrl || "",
      },
    });
  }

  if (action === "remove") {
    const { friendEmail } = await req.json();
    if (!friendEmail) {
      return NextResponse.json({ error: "Invalid friend email" }, { status: 400 });
    }

    // Remove bidirectionally
    await db.collection("profiles").updateOne(
      { userEmail: session.user.email },
      { $pull: { friends: friendEmail } } as any
    );
    await db.collection("profiles").updateOne(
      { userEmail: friendEmail },
      { $pull: { friends: session.user.email } } as any
    );

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
