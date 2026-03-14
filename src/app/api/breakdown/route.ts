import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { BlockerType } from "@/types";

const blockerPrompts: Record<BlockerType, string> = {
  "too-big": `The user feels overwhelmed because this task feels too big.
Break it into very small, concrete micro-steps (each should take 2-5 minutes max).
Start with the absolute simplest action like "Open the document" or "Write one sentence".
Make each step feel effortless and achievable.`,

  "too-boring": `The user finds this task boring and tedious.
Break it into short 5-minute sprint-sized chunks.
Make steps feel quick and punchy. Add a sense of momentum.
Frame steps as quick wins: "Knock out X in 5 minutes".`,

  "no-idea": `The user doesn't know where to start with this task.
Provide clear, specific first steps with guidance on what to do.
Include brief context or tips for steps that might be unfamiliar.
Start from absolute basics - assume they need orientation.`,

  "fear": `The user is scared of doing this task wrong.
Frame everything as a draft, experiment, or first attempt - nothing is permanent.
Include reassuring language. Emphasize that imperfect action beats no action.
Start with low-stakes steps like research or outlining.`,

  "low-energy": `The user has low energy right now.
Make the first 2-3 steps extremely tiny (1-2 minutes each) to build momentum.
Start with physical actions: "Stand up", "Open your laptop", "Open the app".
Keep steps simple enough to do on autopilot.`,
};

export async function POST(request: NextRequest) {
  try {
    const { task, blocker } = await request.json();

    if (!task || !blocker) {
      return NextResponse.json(
        { error: "Task and blocker type are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured. Set ANTHROPIC_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a supportive productivity coach helping someone get started on a task they've been putting off.

${blockerPrompts[blocker as BlockerType]}

The user's task: "${task}"

Generate 5-10 micro-steps to help them complete this task. Each step should be a single, concrete action.

IMPORTANT: Respond with ONLY a JSON array of strings, each string being one step. No other text.
Example: ["Step 1", "Step 2", "Step 3"]`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    const steps: string[] = JSON.parse(content.text);

    return NextResponse.json({ steps });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate steps. Please try again." },
      { status: 500 }
    );
  }
}
