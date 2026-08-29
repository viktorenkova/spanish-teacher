import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/server/observability/logger";
import { loadLatestTeacherFeedback } from "@/server/teacher/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = z.uuid().safeParse(url.searchParams.get("learnerId"));
  const lessonKey = z.enum(["introductions-v1", "daily-routines-v1", "cafe-ordering-v1"])
    .safeParse(url.searchParams.get("lessonKey"));
  const sessionId = z.uuid().safeParse(url.searchParams.get("sessionId"));
  if (!parsed.success || !lessonKey.success || !sessionId.success) {
    return NextResponse.json({ error: "A valid learner and lesson are required." }, { status: 400 });
  }

  try {
    return NextResponse.json({
      teacherFeedback: await loadLatestTeacherFeedback(parsed.data, lessonKey.data, sessionId.data),
    });
  } catch (error) {
    logError("teacher_feedback_load_failed", error, { method: "GET", route: "/api/teacher/feedback" });
    return NextResponse.json({ error: "Teacher feedback could not be loaded." }, { status: 503 });
  }
}
