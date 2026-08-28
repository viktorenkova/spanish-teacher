import { NextResponse } from "next/server";
import { z } from "zod";
import { loadLearnerProgressSummary, loadLessonProgress } from "@/server/review/service";

const learnerIdSchema = z.uuid();
const lessonKeySchema = z.enum(["introductions-v1", "daily-routines-v1", "cafe-ordering-v1"]);

export async function GET(request: Request) {
  const learnerId = new URL(request.url).searchParams.get("learnerId");
  const lessonKey = lessonKeySchema.safeParse(
    new URL(request.url).searchParams.get("lessonKey") ?? "introductions-v1",
  );
  const parsed = learnerIdSchema.safeParse(learnerId);
  if (!parsed.success || !lessonKey.success) {
    return NextResponse.json({ error: "A valid learner and lesson are required." }, { status: 400 });
  }

  try {
    const [progress, summary] = await Promise.all([
      loadLessonProgress(parsed.data, lessonKey.data),
      loadLearnerProgressSummary(parsed.data),
    ]);
    return NextResponse.json({ progress, summary });
  } catch (error) {
    console.error("Unable to load lesson progress", error);
    return NextResponse.json({ error: "Lesson progress could not be loaded." }, { status: 503 });
  }
}
