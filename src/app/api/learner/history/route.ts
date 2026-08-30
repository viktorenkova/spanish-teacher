import { NextResponse } from "next/server";
import { z } from "zod";
import { loadLessonHistory } from "@/server/lesson-history/service";
import { logError } from "@/server/observability/logger";

const learnerIdSchema = z.uuid();

export async function GET(request: Request) {
  const learnerId = new URL(request.url).searchParams.get("learnerId");
  const parsed = learnerIdSchema.safeParse(learnerId);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ history: await loadLessonHistory(parsed.data) });
  } catch (error) {
    logError("lesson_history_load_failed", error, {
      method: "GET",
      route: "/api/learner/history",
    });
    return NextResponse.json({ error: "Lesson history could not be loaded." }, { status: 503 });
  }
}
