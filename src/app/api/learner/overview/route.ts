import { NextResponse } from "next/server";
import { z } from "zod";
import { loadLearnerOverview } from "@/server/learner-overview/service";
import { logError } from "@/server/observability/logger";

const learnerIdSchema = z.uuid();

export async function GET(request: Request) {
  const learnerId = new URL(request.url).searchParams.get("learnerId");
  const parsed = learnerIdSchema.safeParse(learnerId);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ overview: await loadLearnerOverview(parsed.data) });
  } catch (error) {
    logError("learner_overview_load_failed", error, { method: "GET", route: "/api/learner/overview" });
    return NextResponse.json({ error: "Saved progress could not be loaded." }, { status: 503 });
  }
}
