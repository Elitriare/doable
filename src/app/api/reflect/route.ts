import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { step, caption } = await req.json();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `A user just completed this step of their task: "${step}".
They wrote this about it: "${caption}".
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