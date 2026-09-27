import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/server/observability/logger";
import {
  PhrasebookItemNotFoundError,
  recordPhrasebookSelfCheck,
} from "@/server/review/phrasebook-service";

const selfCheckSchema = z.object({
  learnerId: z.uuid(),
  learningItemId: z.string().min(1).max(200),
  remembered: z.boolean(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The phrase self-check is invalid." }, { status: 400 });
  }
  const parsed = selfCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "The phrase self-check is invalid." }, { status: 400 });
  }

  try {
    return NextResponse.json(await recordPhrasebookSelfCheck(parsed.data), { status: 201 });
  } catch (error) {
    if (error instanceof PhrasebookItemNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    logError("phrasebook_self_check_save_failed", error, {
      method: "POST",
      route: "/api/learner/phrasebook/self-check",
    });
    return NextResponse.json({ error: "The phrase check could not be saved. Try again." }, { status: 503 });
  }
}
