import { NextResponse } from "next/server";
import { z } from "zod";
import { loadLatestTeacherFeedback } from "@/server/teacher/service";

export async function GET(request: Request) {
  const parsed = z.uuid().safeParse(new URL(request.url).searchParams.get("learnerId"));
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ teacherFeedback: await loadLatestTeacherFeedback(parsed.data) });
  } catch (error) {
    console.error("Unable to load teacher feedback", error);
    return NextResponse.json({ error: "Teacher feedback could not be loaded." }, { status: 503 });
  }
}
