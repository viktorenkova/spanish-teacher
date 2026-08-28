import "server-only";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import type { LessonKey } from "@/domain/lesson";
import {
  buildLessonPlan,
  chooseCurriculumLesson,
  type LessonPlan,
  type SessionDuration,
} from "@/domain/lesson-planner";
import { getDatabase } from "@/server/db/client";
import {
  exerciseAttempts,
  learnerItemStates,
  learnerSkillEstimates,
  lessonPlans,
} from "@/server/db/schema";

export async function createLessonPlan(input: {
  learnerId: string;
  targetMinutes: SessionDuration;
  now?: Date;
}) {
  const db = getDatabase();
  const now = input.now ?? new Date();
  const [dueItems, skillEstimates, completedIntroductionExercises] = await Promise.all([
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
    db
      .select({ exerciseId: exerciseAttempts.exerciseId })
      .from(exerciseAttempts)
      .where(
        and(
          eq(exerciseAttempts.learnerId, input.learnerId),
          eq(exerciseAttempts.lessonKey, "introductions-v1"),
          eq(exerciseAttempts.correct, true),
        ),
      ),
  ]);

  const lessonKey = chooseCurriculumLesson({
    completedIntroductionExerciseIds: completedIntroductionExercises.map(
      ({ exerciseId }) => exerciseId,
    ),
  });

  const plan = buildLessonPlan({
    targetMinutes: input.targetMinutes,
    dueReviewCount: dueItems.length,
    weakestSkills: skillEstimates.map(({ skill }) => skill),
    lessonKey,
  });
  const [saved] = await db
    .insert(lessonPlans)
    .values({
      learnerId: input.learnerId,
      targetMinutes: plan.targetMinutes,
      estimatedMinutes: plan.estimatedMinutes,
      plannerVersion: plan.plannerVersion,
      plan: { lessonKey: plan.lessonKey, rationale: plan.rationale, blocks: plan.blocks },
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
    lessonKey: (saved.plan.lessonKey ?? "introductions-v1") as LessonKey,
    targetMinutes: saved.targetMinutes as SessionDuration,
    estimatedMinutes: saved.estimatedMinutes,
    rationale: saved.plan.rationale,
    blocks: saved.plan.blocks as LessonPlan["blocks"],
    createdAt: saved.createdAt.toISOString(),
  };
}
