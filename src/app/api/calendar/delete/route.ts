import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { eventIds } = await req.json() as { eventIds: string[] };

    await Promise.all(
      eventIds.map((id) =>
        fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.accessToken!}`,
            },
          }
        )
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete events" }, { status: 500 });
  }
}