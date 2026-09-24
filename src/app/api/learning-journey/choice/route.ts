import { NextResponse } from "next/server";
import { z } from "zod";
import { recordJourneyChoice } from "@/server/learning-journey/service";
import { logError } from "@/server/observability/logger";

const choiceSchema = z.object({
  learnerId: z.uuid(),
  sessionId: z.uuid(),
  choice: z.enum(["next_lesson", "review"]),
});

export async function POST(request: Request) {
  const parsed = choiceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "A completed lesson and valid choice are required." }, { status: 400 });
  }

  try {
    await recordJourneyChoice(parsed.data);
    return NextResponse.json({ recorded: true });
  } catch (error) {
    if (error instanceof Error && error.message === "COMPLETION_NOT_ELIGIBLE") {
      return NextResponse.json({ error: "This completed lesson is outside the choice window." }, { status: 409 });
    }
    logError("learning_journey_choice_failed", error, { method: "POST", route: "/api/learning-journey/choice" });
    return NextResponse.json({ error: "The choice could not be recorded." }, { status: 503 });
  }
}
