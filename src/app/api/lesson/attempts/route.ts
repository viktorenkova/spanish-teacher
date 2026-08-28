import { NextResponse } from "next/server";
import { z } from "zod";
import { recordExerciseAttempt } from "@/server/review/service";

const attemptSchema = z.object({
  learnerId: z.uuid(),
  planId: z.uuid(),
  lessonKey: z.enum(["introductions-v1", "daily-routines-v1", "cafe-ordering-v1"]),
  exerciseId: z.string().min(1).max(100),
  selectedOptionId: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const parsed = attemptSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "The exercise attempt is invalid." }, { status: 400 });
  }

  try {
    return NextResponse.json(await recordExerciseAttempt(parsed.data), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unknown exercise") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Speaking task requires transcript evidence") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Unable to save exercise attempt", error);
    return NextResponse.json({ error: "The answer could not be saved." }, { status: 503 });
  }
}
