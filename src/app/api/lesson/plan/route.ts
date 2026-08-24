import { NextResponse } from "next/server";
import { z } from "zod";
import { supportedSessionDurations } from "@/domain/lesson-planner";
import {
  createLessonPlan,
  loadLatestLessonPlan,
} from "@/server/lesson-planner/service";

const learnerIdSchema = z.uuid();
const createPlanSchema = z.object({
  learnerId: learnerIdSchema,
  targetMinutes: z.union(supportedSessionDurations.map((duration) => z.literal(duration))),
});

export async function GET(request: Request) {
  const learnerId = new URL(request.url).searchParams.get("learnerId");
  const parsed = learnerIdSchema.safeParse(learnerId);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ plan: await loadLatestLessonPlan(parsed.data) });
  } catch (error) {
    console.error("Unable to load lesson plan", error);
    return NextResponse.json({ error: "The lesson plan could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const parsed = createPlanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a supported lesson duration." }, { status: 400 });
  }

  try {
    return NextResponse.json({ plan: await createLessonPlan(parsed.data) }, { status: 201 });
  } catch (error) {
    console.error("Unable to create lesson plan", error);
    return NextResponse.json({ error: "The lesson plan could not be created." }, { status: 503 });
  }
}

