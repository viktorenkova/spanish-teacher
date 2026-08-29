import { NextResponse } from "next/server";
import { z } from "zod";
import {
  pilotFeedbackMicrophoneOptions,
  pilotFeedbackPacingOptions,
  pilotFeedbackReadingTimeOptions,
} from "@/domain/pilot-feedback";
import { logError } from "@/server/observability/logger";
import { loadPilotFeedback, savePilotFeedback } from "@/server/pilot-feedback/service";

const identitySchema = z.object({
  learnerId: z.uuid(),
  sessionId: z.uuid(),
});

const pilotFeedbackSchema = identitySchema.extend({
  overallRating: z.number().int().min(1).max(5),
  pacing: z.enum(pilotFeedbackPacingOptions),
  readingTime: z.enum(pilotFeedbackReadingTimeOptions),
  microphoneCapture: z.enum(pilotFeedbackMicrophoneOptions),
  comment: z.string().trim().max(1_000).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = identitySchema.safeParse({
    learnerId: url.searchParams.get("learnerId"),
    sessionId: url.searchParams.get("sessionId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner and lesson session are required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ feedback: await loadPilotFeedback(parsed.data.learnerId, parsed.data.sessionId) });
  } catch (error) {
    logError("pilot_feedback_load_failed", error, { method: "GET", route: "/api/pilot-feedback" });
    return NextResponse.json({ error: "Pilot feedback could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const parsed = pilotFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the lesson feedback fields." }, { status: 400 });
  }

  try {
    return NextResponse.json({ feedback: await savePilotFeedback(parsed.data) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNKNOWN_LESSON_SESSION") {
      return NextResponse.json({ error: "The lesson session was not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "LESSON_SESSION_NOT_COMPLETED") {
      return NextResponse.json({ error: "Feedback is available after the lesson is complete." }, { status: 409 });
    }
    logError("pilot_feedback_save_failed", error, { method: "POST", route: "/api/pilot-feedback" });
    return NextResponse.json({ error: "Pilot feedback could not be saved." }, { status: 503 });
  }
}
