import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/server/observability/logger";
import { submitSpeakingAttemptWithTeacher } from "@/server/teacher/service";

const speakingAttemptSchema = z.object({
  learnerId: z.uuid(),
  planId: z.uuid(),
  sessionId: z.uuid(),
  lessonKey: z.enum(["introductions-v1", "daily-routines-v1", "cafe-ordering-v1"]),
  exerciseId: z.string().min(1).max(100),
  transcript: z.string().trim().min(1).max(500),
  evidenceProvider: z.string().min(1).max(100),
  providerConfidence: z.number().min(0).max(1).optional(),
});

export async function POST(request: Request) {
  const parsed = speakingAttemptSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "The speaking attempt is invalid." }, { status: 400 });
  }

  try {
    return NextResponse.json(await submitSpeakingAttemptWithTeacher(parsed.data), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unknown speaking exercise") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    logError("speaking_attempt_save_failed", error, { method: "POST", route: "/api/lesson/speaking-attempts" });
    return NextResponse.json({ error: "The speaking attempt could not be saved." }, { status: 503 });
  }
}
