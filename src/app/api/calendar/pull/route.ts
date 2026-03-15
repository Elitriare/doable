import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${week}&singleEvents=true&orderBy=startTime&maxResults=10`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    const data = await res.json();
    const events = (data.items || []).map((e: any) => ({
      id: e.id,
      title: e.summary,
      start: e.start?.dateTime || e.start?.date,
      description: e.description || "",
    }));

    return NextResponse.json({ events });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}