import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const step = formData.get("step") as string;

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
              text: `The user was supposed to complete this step: "${step}".
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