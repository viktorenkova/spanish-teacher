import "server-only";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import {
  buildLessonPlan,
  type LessonPlan,
  type SessionDuration,
} from "@/domain/lesson-planner";
import { getDatabase } from "@/server/db/client";
import { learnerItemStates, learnerSkillEstimates, lessonPlans } from "@/server/db/schema";

export async function createLessonPlan(input: {
  learnerId: string;
  targetMinutes: SessionDuration;
  now?: Date;
}) {
  const db = getDatabase();
  const now = input.now ?? new Date();
  const [dueItems, skillEstimates] = await Promise.all([
    db
      .select({ id: learnerItemStates.id })
      .from(learnerItemStates)
      .where(
        and(
          eq(learnerItemStates.learnerId, input.learnerId),
          lte(learnerItemStates.due, now),
        ),
      ),
    db
      .select({ skill: learnerSkillEstimates.skill })
      .from(learnerSkillEstimates)
      .where(
        and(
          eq(learnerSkillEstimates.learnerId, input.learnerId),
          eq(learnerSkillEstimates.status, "assessed"),
        ),
      )
      .orderBy(asc(learnerSkillEstimates.confidence))
      .limit(2),
  ]);

  const plan = buildLessonPlan({
    targetMinutes: input.targetMinutes,
    dueReviewCount: dueItems.length,
    weakestSkills: skillEstimates.map(({ skill }) => skill),
  });
  const [saved] = await db
    .insert(lessonPlans)
    .values({
      learnerId: input.learnerId,
      targetMinutes: plan.targetMinutes,
      estimatedMinutes: plan.estimatedMinutes,
      plannerVersion: plan.plannerVersion,
      plan: { rationale: plan.rationale, blocks: plan.blocks },
      createdAt: now,
    })
    .returning();

  return { id: saved.id, ...plan, createdAt: saved.createdAt.toISOString() };
}

export async function loadLatestLessonPlan(learnerId: string) {
  const db = getDatabase();
  const [saved] = await db
    .select()
    .from(lessonPlans)
    .where(eq(lessonPlans.learnerId, learnerId))
    .orderBy(desc(lessonPlans.createdAt))
    .limit(1);

  if (!saved) return null;
  return {
    id: saved.id,
    plannerVersion: saved.plannerVersion as LessonPlan["plannerVersion"],
    targetMinutes: saved.targetMinutes as SessionDuration,
    estimatedMinutes: saved.estimatedMinutes,
    rationale: saved.plan.rationale,
    blocks: saved.plan.blocks as LessonPlan["blocks"],
    createdAt: saved.createdAt.toISOString(),
  };
}

