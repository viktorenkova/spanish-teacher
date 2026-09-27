import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { buildLearnerOverview } from "@/domain/learner-overview";
import { isLessonKey, type LessonKey } from "@/domain/lesson";
import { isLearnerPrimaryGoal } from "@/domain/learner-profile";
import {
  supportedSessionDurations,
  type SessionDuration,
} from "@/domain/lesson-planner";
import { getDatabase } from "@/server/db/client";
import {
  exerciseAttempts,
  learnerItemStates,
  learners,
  learningItems,
  lessonSessions,
} from "@/server/db/schema";
import { loadLearnerProgressSummary } from "@/server/review/service";

export class LearnerOverviewNotFoundError extends Error {
  constructor() {
    super("Learner profile not found");
    this.name = "LearnerOverviewNotFoundError";
  }
}

export async function loadLearnerOverview(learnerId: string) {
  const db = getDatabase();
  const [learner, progress, correctAttempts, completedLessons, savedPhrases, selfChecks] = await Promise.all([
    db
      .select({
        displayName: learners.displayName,
        overallLevel: learners.overallLevel,
        a1Band: learners.a1Band,
        primaryGoal: learners.primaryGoal,
        preferredSessionMinutes: learners.preferredSessionMinutes,
      })
      .from(learners)
      .where(eq(learners.id, learnerId))
      .limit(1)
      .then((rows) => rows[0]),
    loadLearnerProgressSummary(learnerId),
    db
      .select({
        lessonKey: exerciseAttempts.lessonKey,
        exerciseId: exerciseAttempts.exerciseId,
      })
      .from(exerciseAttempts)
      .where(and(
        eq(exerciseAttempts.learnerId, learnerId),
        eq(exerciseAttempts.correct, true),
      )),
    db
      .select({ id: lessonSessions.id })
      .from(lessonSessions)
      .where(and(
        eq(lessonSessions.learnerId, learnerId),
        eq(lessonSessions.status, "completed"),
      )),
    db
      .select({
        id: learningItems.id,
        targetText: learningItems.targetText,
        supportText: learningItems.supportText,
        dueAt: learnerItemStates.due,
      })
      .from(learnerItemStates)
      .innerJoin(learningItems, eq(learnerItemStates.learningItemId, learningItems.id))
      .where(eq(learnerItemStates.learnerId, learnerId))
      .orderBy(desc(learnerItemStates.updatedAt)),
    db
      .select({
        learningItemId: exerciseAttempts.learningItemId,
        selectedOptionId: exerciseAttempts.selectedOptionId,
      })
      .from(exerciseAttempts)
      .where(and(
        eq(exerciseAttempts.learnerId, learnerId),
        eq(exerciseAttempts.evidenceProvider, "phrasebook-self-check"),
      ))
      .orderBy(desc(exerciseAttempts.occurredAt)),
  ]);

  if (!learner) throw new LearnerOverviewNotFoundError();

  const primaryGoal = isLearnerPrimaryGoal(learner.primaryGoal)
    ? learner.primaryGoal
    : "conversation";
  const preferredSessionMinutes = supportedSessionDurations.includes(
    learner.preferredSessionMinutes as SessionDuration,
  )
    ? learner.preferredSessionMinutes as SessionDuration
    : 10;

  const completedExerciseIds = correctAttempts.reduce<Partial<Record<LessonKey, string[]>>>(
    (byLesson, attempt) => {
      if (!isLessonKey(attempt.lessonKey)) return byLesson;
      const lessonKey = attempt.lessonKey as LessonKey;
      const ids = byLesson[lessonKey] ?? [];
      if (!ids.includes(attempt.exerciseId)) ids.push(attempt.exerciseId);
      byLesson[lessonKey] = ids;
      return byLesson;
    },
    {},
  );
  const latestSelfChecks = new Map<string, "remembered" | "help">();
  for (const check of selfChecks) {
    if (!latestSelfChecks.has(check.learningItemId)) {
      latestSelfChecks.set(check.learningItemId,
        check.selectedOptionId === "remembered" ? "remembered" : "help");
    }
  }
  const phrasebook = savedPhrases.map((item) => ({
    id: item.id,
    targetText: item.targetText,
    supportText: item.supportText,
    dueAt: item.dueAt.toISOString(),
    lastSelfCheck: latestSelfChecks.get(item.id),
  }));

  return buildLearnerOverview({
    learner: { ...learner, primaryGoal, preferredSessionMinutes },
    progress,
    completedLessonCount: completedLessons.length,
    completedExerciseIds,
    phrasebook,
  });
}
