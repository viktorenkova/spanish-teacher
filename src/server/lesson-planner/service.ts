import "server-only";
import { and, asc, desc, eq, inArray, lte, ne } from "drizzle-orm";
import {
  getLearningItemDefinition,
  type LessonKey,
  type ReviewCandidate,
} from "@/domain/lesson";
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
  learnerMistakes,
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
  const [
    dueItems,
    skillEstimates,
    completedIntroductionExercises,
    completedDailyRoutineExercises,
    activeMistakes,
  ] = await Promise.all([
    db
      .select({ learningItemId: learnerItemStates.learningItemId })
      .from(learnerItemStates)
      .where(
        and(
          eq(learnerItemStates.learnerId, input.learnerId),
          lte(learnerItemStates.due, now),
        ),
      )
      .orderBy(asc(learnerItemStates.due)),
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
    db
      .select({ exerciseId: exerciseAttempts.exerciseId })
      .from(exerciseAttempts)
      .where(
        and(
          eq(exerciseAttempts.learnerId, input.learnerId),
          eq(exerciseAttempts.lessonKey, "daily-routines-v1"),
          eq(exerciseAttempts.correct, true),
        ),
      ),
    db
      .select({ learningItemId: learnerMistakes.learningItemId })
      .from(learnerMistakes)
      .where(
        and(
          eq(learnerMistakes.learnerId, input.learnerId),
          inArray(learnerMistakes.status, ["active", "improving"]),
        ),
      )
      .orderBy(desc(learnerMistakes.updatedAt)),
  ]);

  const lessonKey = chooseCurriculumLesson({
    completedIntroductionExerciseIds: completedIntroductionExercises.map(
      ({ exerciseId }) => exerciseId,
    ),
    completedDailyRoutineExerciseIds: completedDailyRoutineExercises.map(
      ({ exerciseId }) => exerciseId,
    ),
  });

  const activeItemIds = new Set(activeMistakes.map(({ learningItemId }) => learningItemId));
  const reviewCandidates: ReviewCandidate[] = [
    ...activeMistakes.map(({ learningItemId }) => learningItemId),
    ...dueItems.map(({ learningItemId }) => learningItemId),
  ]
    .filter((learningItemId, index, itemIds) => itemIds.indexOf(learningItemId) === index)
    .map((learningItemId) => {
      const learningItem = getLearningItemDefinition(learningItemId);
      if (!learningItem) return undefined;
      return {
        learningItem,
        reason: activeItemIds.has(learningItemId) ? "learner_weakness" as const : "due_review" as const,
      };
    })
    .filter((candidate): candidate is ReviewCandidate => Boolean(candidate));

  const plan = buildLessonPlan({
    targetMinutes: input.targetMinutes,
    dueReviewCount: dueItems.length,
    weakestSkills: skillEstimates.map(({ skill }) => skill),
    lessonKey,
    reviewCandidates,
    activeMistakeCount: activeMistakes.length,
    reviewExerciseKey: now.getTime().toString(36),
  });
  const [saved] = await db
    .insert(lessonPlans)
    .values({
      learnerId: input.learnerId,
      targetMinutes: plan.targetMinutes,
      estimatedMinutes: plan.estimatedMinutes,
      plannerVersion: plan.plannerVersion,
      plan: {
        lessonKey: plan.lessonKey,
        rationale: plan.rationale,
        blocks: plan.blocks,
        reviewExercises: plan.reviewExercises,
      },
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
    .where(
      and(
        eq(lessonPlans.learnerId, learnerId),
        ne(lessonPlans.status, "completed"),
      ),
    )
    .orderBy(desc(lessonPlans.createdAt))
    .limit(1);

  return saved ? mapSavedLessonPlan(saved) : null;
}

export function mapSavedLessonPlan(saved: typeof lessonPlans.$inferSelect) {
  return {
    id: saved.id,
    plannerVersion: saved.plannerVersion as LessonPlan["plannerVersion"],
    lessonKey: (saved.plan.lessonKey ?? "introductions-v1") as LessonKey,
    targetMinutes: saved.targetMinutes as SessionDuration,
    estimatedMinutes: saved.estimatedMinutes,
    rationale: saved.plan.rationale,
    blocks: saved.plan.blocks as LessonPlan["blocks"],
    reviewExercises: saved.plan.reviewExercises ?? [],
    createdAt: saved.createdAt.toISOString(),
  };
}
