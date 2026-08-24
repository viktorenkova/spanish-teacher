import { NextResponse } from "next/server";
import { z } from "zod";
import { loadLessonProgress } from "@/server/review/service";

const learnerIdSchema = z.uuid();

export async function GET(request: Request) {
  const learnerId = new URL(request.url).searchParams.get("learnerId");
  const parsed = learnerIdSchema.safeParse(learnerId);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ progress: await loadLessonProgress(parsed.data) });
  } catch (error) {
    console.error("Unable to load lesson progress", error);
    return NextResponse.json({ error: "Lesson progress could not be loaded." }, { status: 503 });
  }
}

