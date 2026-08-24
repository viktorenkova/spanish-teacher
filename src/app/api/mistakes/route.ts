import { NextResponse } from "next/server";
import { z } from "zod";
import { loadMistakeMemory } from "@/server/mistakes/service";

export async function GET(request: Request) {
  const parsed = z.uuid().safeParse(new URL(request.url).searchParams.get("learnerId"));
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ mistakeMemory: await loadMistakeMemory(parsed.data) });
  } catch (error) {
    console.error("Unable to load mistake memory", error);
    return NextResponse.json({ error: "Mistake memory could not be loaded." }, { status: 503 });
  }
}
