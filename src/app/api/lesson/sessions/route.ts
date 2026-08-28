import { NextResponse } from "next/server";
import { z } from "zod";
import {
  abandonLessonSession,
  loadActiveLessonSession,
  startLessonSession,
} from "@/server/lesson-sessions/service";

const learnerIdSchema = z.uuid();
const startSessionSchema = z.object({
  learnerId: learnerIdSchema,
  planId: z.uuid(),
});
const updateSessionSchema = z.object({
  action: z.literal("abandon"),
  learnerId: learnerIdSchema,
  sessionId: z.uuid(),
});

export async function GET(request: Request) {
  const parsed = learnerIdSchema.safeParse(new URL(request.url).searchParams.get("learnerId"));
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ session: await loadActiveLessonSession(parsed.data) });
  } catch (error) {
    console.error("Unable to load active lesson session", error);
    return NextResponse.json({ error: "The active lesson could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const parsed = startSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner and lesson plan are required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ session: await startLessonSession(parsed.data) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "LESSON_PLAN_UNAVAILABLE") {
      return NextResponse.json({ error: "This lesson plan is no longer available." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "ACTIVE_LESSON_EXISTS") {
      return NextResponse.json({ error: "Resume the active lesson before starting another." }, { status: 409 });
    }
    console.error("Unable to start lesson session", error);
    return NextResponse.json({ error: "The lesson could not be started." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const parsed = updateSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid active lesson is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ session: await abandonLessonSession(parsed.data) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNKNOWN_LESSON_SESSION") {
      return NextResponse.json({ error: "This lesson session was not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "LESSON_SESSION_NOT_ACTIVE") {
      return NextResponse.json({ error: "This lesson is no longer active." }, { status: 409 });
    }
    console.error("Unable to end lesson session", error);
    return NextResponse.json({ error: "The lesson could not be ended safely." }, { status: 503 });
  }
}
