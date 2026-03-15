import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const client = new Anthropic();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const image = formData.get("image") as File;
    const step = formData.get("step") as string;

    if (!image || !step || typeof step !== "string") {
      return NextResponse.json({ valid: false, reason: "Missing image or step." }, { status: 400 });
    }

    // Validate file size
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json({ valid: false, reason: "Image too large. Max 10 MB." }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json({ valid: false, reason: "Invalid file type. Use JPEG, PNG, or WebP." }, { status: 400 });
    }

    const safeStep = step.slice(0, 500);

    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mediaType = image.type as "image/jpeg" | "image/png";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `The user was supposed to complete this step: "${safeStep}".
Does this image reasonably show evidence of completing that step?
Be lenient — if the image is plausibly related, accept it.
You MUST respond with ONLY a raw JSON object, no markdown, no explanation, no backticks.
Example: {"valid":false,"reason":"The image shows a cat, not a completed document."}`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    let valid = false;
    let reason = "Could not verify proof.";

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      valid = parsed.valid;
      reason = parsed.reason;
    } catch {
      const validMatch = text.includes('"valid":true') || text.includes('"valid": true');
      const reasonMatch = text.match(/"reason"\s*:\s*"([^"]+)"/);
      valid = validMatch;
      reason = reasonMatch?.[1] ?? text.slice(0, 150);
    }

    return NextResponse.json({ valid, reason });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ valid: false, reason: "Verification failed. Please try again." });
  }
}