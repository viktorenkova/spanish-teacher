import { NextResponse } from "next/server";
import { z } from "zod";
import { logError } from "@/server/observability/logger";
import { loadLearnerProgressSummary, loadLessonProgress } from "@/server/review/service";

const learnerIdSchema = z.uuid();
const lessonKeySchema = z.enum(["introductions-v1", "daily-routines-v1", "cafe-ordering-v1"]);

export async function GET(request: Request) {
  const learnerId = new URL(request.url).searchParams.get("learnerId");
  const lessonKey = lessonKeySchema.safeParse(
    new URL(request.url).searchParams.get("lessonKey") ?? "introductions-v1",
  );
  const sessionId = z.uuid().optional().safeParse(
    new URL(request.url).searchParams.get("sessionId") ?? undefined,
  );
  const parsed = learnerIdSchema.safeParse(learnerId);
  if (!parsed.success || !lessonKey.success || !sessionId.success) {
    return NextResponse.json({ error: "A valid learner and lesson are required." }, { status: 400 });
  }

  try {
    const [progress, summary] = await Promise.all([
      loadLessonProgress(parsed.data, lessonKey.data, sessionId.data),
      loadLearnerProgressSummary(parsed.data),
    ]);
    return NextResponse.json({ progress, summary });
  } catch (error) {
    logError("lesson_progress_load_failed", error, { method: "GET", route: "/api/lesson/progress" });
    return NextResponse.json({ error: "Lesson progress could not be loaded." }, { status: 503 });
  }
}
