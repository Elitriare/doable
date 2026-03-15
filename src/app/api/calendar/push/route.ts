import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Step } from "@/types";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { taskTitle, steps, startTime } = await req.json() as {
      taskTitle: string;
      steps: Step[];
      startTime: string;
    };

    let current = new Date(startTime);
    const eventIds: string[] = [];

    for (const step of steps) {
      const start = current.toISOString();
      const end = new Date(current.getTime() + step.estimatedMinutes * 60000).toISOString();

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `${taskTitle} — ${step.step}`,
            description: step.journalPrompt,
            start: { dateTime: start },
            end: { dateTime: end },
          }),
        }
      );

      const event = await res.json();
      eventIds.push(event.id);
      current = new Date(end);
    }

    return NextResponse.json({ success: true, eventIds });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create calendar events" }, { status: 500 });
  }
}