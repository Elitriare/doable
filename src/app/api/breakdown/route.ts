import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { BlockerType } from "@/types";

const blockerPrompts: Record<BlockerType, string> = {
  "too-big": `The user feels overwhelmed because this task feels too big and daunting.
Break it into meaningful phases that each take 10-20 minutes.
Make each phase feel like a real, satisfying chunk of progress.`,

  "too-boring": `The user finds this task boring and tedious — they just can't be bothered.
Break it into punchy, momentum-building phases.
Frame each as a quick win. Keep the energy light and irreverent.`,

  "no-idea": `The user doesn't know where to start — they feel lost and directionless.
Break it into clear phases with enough context that they know exactly what to do.
Start from orientation and build toward completion.`,

  "fear": `The user is scared of doing this task wrong — perfectionism or fear of failure is blocking them.
Break it into low-stakes phases framed as drafts or experiments.
Emphasise that imperfect action beats no action.`,

  "low-energy": `The user has low energy right now — they're tired and struggling to get going.
Break it into phases, starting very gently and building momentum gradually.
Keep early phases simple and almost effortless.`,
};

const blockerExamples: Record<BlockerType, string> = {
  "too-big": `Example for a "too-big" blocker:
[
  {
    "step": "Break the task into a rough outline",
    "journalPrompt": "This felt huge, so let's just shrink it down first — no doing yet, just mapping. Once you've got it on paper, snap a pic of your outline.",
    "estimatedMinutes": 10
  },
  {
    "step": "Tackle the first section only",
    "journalPrompt": "You already made it smaller — now just eat the first bite. One section, that's it. Photo it when you're done.",
    "estimatedMinutes": 20
  }
]`,

  "too-boring": `Example for a "too-boring" blocker:
[
  {
    "step": "Set a 10-minute timer and just start",
    "journalPrompt": "Yeah it's boring, we're not going to pretend otherwise — but 10 minutes of boring is survivable. Set the timer and go. Snap a pic when it goes off.",
    "estimatedMinutes": 10
  },
  {
    "step": "Push through the next chunk",
    "journalPrompt": "One round done — turns out boring tasks move faster than they look. Keep that going and knock out this next bit. Photo when done.",
    "estimatedMinutes": 15
  }
]`,

  "no-idea": `Example for a "no-idea" blocker:
[
  {
    "step": "Do a quick 10-minute research sprint",
    "journalPrompt": "You're not lost, you just haven't oriented yet — let's fix that first. Spend 10 minutes looking at examples or reading up. Snap a pic of your notes.",
    "estimatedMinutes": 10
  },
  {
    "step": "Write down a rough plan based on what you found",
    "journalPrompt": "You've got more of an idea now than you did before — use that. Jot down a rough order of attack. Photo it when you're done.",
    "estimatedMinutes": 15
  }
]`,

  "fear": `Example for a "fear" blocker:
[
  {
    "step": "Write a rough outline — nothing precious",
    "journalPrompt": "You've been scared of getting this wrong, so let's take the pressure off — this is a draft that no one will ever see. Scribble something down and snap a pic.",
    "estimatedMinutes": 15
  },
  {
    "step": "Flesh out your first section",
    "journalPrompt": "You already broke the seal — that outline was the hardest part and you did it. Now just expand one section, still no pressure. Photo it when done.",
    "estimatedMinutes": 20
  }
]`,

  "low-energy": `Example for a "low-energy" blocker:
[
  {
    "step": "Just open everything you need",
    "journalPrompt": "You don't have to do anything yet — just open the files, the tabs, the tools. That's the whole step. Snap a pic of your screen when it's all open.",
    "estimatedMinutes": 5
  },
  {
    "step": "Do the easiest part first",
    "journalPrompt": "You're already in it — that's honestly the win. Now just pick the easiest thing on the list and do that one. Photo when done.",
    "estimatedMinutes": 15
  }
]`,
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
        { error: "Service temporarily unavailable" },
        { status: 500 }
      );
    }

    // Sanitize inputs — limit length to prevent abuse
    const safeTask = String(task).slice(0, 500);
    const safeBlocker = String(blocker).slice(0, 50);

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a supportive productivity coach helping someone complete a task they've been putting off.

${blockerPrompts[safeBlocker as BlockerType] || blockerPrompts["too-big"]}

The user's task: "${safeTask}"

Generate the RIGHT number of steps for this task — no more, no less.
- Quick tasks (reply to email, make a call, tidy desk): 2-3 steps
- Medium tasks (write an essay outline, study a chapter, prep a presentation): 3-5 steps
- Big tasks (write a full paper, build a project, deep study session): 5-7 steps
Every step must represent REAL progress. Never pad with filler like "open your laptop" or "take a deep breath" unless the blocker is low-energy. If the task is simple, 2-3 steps is perfect — don't stretch it.

The journalPrompt for each step must:
- For step 1: directly acknowledge the EXACT reason they're stuck ("${safeBlocker}") and speak to that specific feeling before encouraging them in
- For step 2+: build on the previous step — reference that they've already made progress and use that momentum
- End with a natural nudge to snap a photo once done
- Casual and warm, like a friend who gets it — not a corporate coach
- 1-2 sentences max

Also suggest a short category label for this task (e.g. "Math", "English", "Work", "Chores", "Coding", "Health").

IMPORTANT: Respond with ONLY a JSON object like this, no other text:
{"steps": [{"step": "...", "journalPrompt": "...", "estimatedMinutes": 10}, ...], "category": "Work"}

${blockerExamples[safeBlocker as BlockerType] || blockerExamples["too-big"]}`,
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

    const clean = content.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Handle both formats: array of steps or object with steps + category
    const steps = Array.isArray(parsed) ? parsed : parsed.steps;
    const category = Array.isArray(parsed) ? "Uncategorized" : (parsed.category || "Uncategorized");

    return NextResponse.json({ steps, category });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate steps. Please try again." },
      { status: 500 }
    );
  }
}
