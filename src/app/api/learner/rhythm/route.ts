import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/server/observability/logger";
import { loadPracticeRhythm } from "@/server/practice-rhythm/service";

const querySchema = z.object({
  learnerId: z.uuid(),
  timezoneOffsetMinutes: z.coerce.number().int().min(-840).max(840),
});

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    learnerId: searchParams.get("learnerId"),
    timezoneOffsetMinutes: searchParams.get("timezoneOffsetMinutes"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID and timezone are required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ rhythm: await loadPracticeRhythm(parsed.data) });
  } catch (error) {
    logError("practice_rhythm_load_failed", error, {
      method: "GET",
      route: "/api/learner/rhythm",
    });
    return NextResponse.json({ error: "Practice rhythm could not be loaded." }, { status: 503 });
  }
}
