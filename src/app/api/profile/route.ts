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
  const profile = await db
    .collection("profiles")
    .findOne({ userEmail: session.user.email });

  if (!profile) {
    return NextResponse.json({ profile: null });
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
    { $set: { ...profile, userEmail: session.user.email } },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
