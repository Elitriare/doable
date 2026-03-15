import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { step, caption } = await req.json();

    if (!step || typeof step !== "string" || !caption || typeof caption !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Sanitize inputs for LLM prompt (limit length)
    const safeStep = step.slice(0, 500);
    const safeCaption = caption.slice(0, 1000);

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `A user just completed this step of their task: "${safeStep}".
They wrote this about it: "${safeCaption}".
Write a 1-2 sentence warm, encouraging reflection back to them in second person.
Be specific to what they wrote. Be genuine, not cheesy.
Reply with just the reflection, no quotes, no preamble.
Acknowledge what they did, be warm and friendly.
Keep it short.`,
      }],
    });

    const reflection = response.content[0].type === "text" ? response.content[0].text : "Great work on this step!";
    return NextResponse.json({ reflection });
  } catch {
    return NextResponse.json({ reflection: "Great work completing this step. Keep the momentum going!" });
  }
}