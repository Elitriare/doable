import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

// GET — fetch leaderboard (self + friends with points)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  const myProfile = await db.collection("profiles").findOne({ userEmail: session.user.email });

  if (!myProfile) {
    return NextResponse.json({ leaderboard: [], friendCode: "" });
  }

  const friendEmails: string[] = myProfile.friends || [];

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
      displayName: myProfile.displayName || session.user.name || "You",
      avatarUrl: myProfile.avatarUrl || session.user.image || "",
      points: myProfile.points || 0,
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
    friendCode: myProfile.friendCode || "",
    points: myProfile.points || 0,
    pointsHistory: myProfile.pointsHistory || [],
  });
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
    const myProfile = await db.collection("profiles").findOne({ userEmail: session.user.email });
    if (myProfile?.friends?.includes(friendProfile.userEmail)) {
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
