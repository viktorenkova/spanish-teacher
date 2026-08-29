import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateDiagnostic } from "@/domain/diagnostic";
import { getDatabase } from "@/server/db/client";
import { logError } from "@/server/observability/logger";
import {
  diagnosticAttempts,
  learners,
  learnerSkillEstimates,
} from "@/server/db/schema";

const onboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  primaryGoal: z.enum(["conversation", "travel", "daily-life"]),
  priorExperience: z.enum(["new", "some-basics", "returning"]),
  preferredSessionMinutes: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20),
    z.literal(30),
  ]),
  answers: z.record(z.string(), z.string()),
});

export async function POST(request: Request) {
  const parsed = onboardingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete the onboarding questions and diagnostic." },
      { status: 400 },
    );
  }

  try {
    const result = evaluateDiagnostic(parsed.data.answers);
    const db = getDatabase();
    const learner = await db.transaction(async (transaction) => {
      const [createdLearner] = await transaction
        .insert(learners)
        .values({
          displayName: parsed.data.displayName,
          primaryGoal: parsed.data.primaryGoal,
          priorExperience: parsed.data.priorExperience,
          preferredSessionMinutes: parsed.data.preferredSessionMinutes,
          a1Band: result.overallBand,
        })
        .returning();

      await transaction.insert(learnerSkillEstimates).values(
        result.skillEstimates.map((estimate) => ({
          learnerId: createdLearner.id,
          skill: estimate.skill,
          status: estimate.status,
          a1Band: estimate.a1Band,
          confidence: estimate.confidence,
          evidenceCount: estimate.evidenceCount,
        })),
      );

      await transaction.insert(diagnosticAttempts).values({
        learnerId: createdLearner.id,
        version: result.version,
        answers: parsed.data.answers,
        score: result.score,
        maxScore: result.maxScore,
      });

      return createdLearner;
    });

    return NextResponse.json(
      {
        learner: {
          id: learner.id,
          displayName: learner.displayName,
          overallLevel: learner.overallLevel,
          a1Band: learner.a1Band,
        },
        diagnostic: {
          score: result.score,
          maxScore: result.maxScore,
          listeningStatus: "unassessed",
          speakingStatus: "unassessed",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logError("onboarding_persist_failed", error, { method: "POST", route: "/api/onboarding" });
    return NextResponse.json(
      { error: "The learner profile could not be saved. Check the database connection." },
      { status: 503 },
    );
  }
}
