import "server-only";
import { and, eq } from "drizzle-orm";
import { buildLearnerOverview } from "@/domain/learner-overview";
import type { LessonKey } from "@/domain/lesson";
import { getDatabase } from "@/server/db/client";
import { exerciseAttempts, learners, lessonSessions } from "@/server/db/schema";
import { loadLearnerProgressSummary } from "@/server/review/service";

export class LearnerOverviewNotFoundError extends Error {
  constructor() {
    super("Learner profile not found");
    this.name = "LearnerOverviewNotFoundError";
  }
}

export async function loadLearnerOverview(learnerId: string) {
  const db = getDatabase();
  const [learner, progress, correctAttempts, completedLessons] = await Promise.all([
    db
      .select({
        displayName: learners.displayName,
        overallLevel: learners.overallLevel,
        a1Band: learners.a1Band,
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
  ]);

  if (!learner) throw new LearnerOverviewNotFoundError();

  const completedExerciseIds = correctAttempts.reduce<Partial<Record<LessonKey, string[]>>>(
    (byLesson, attempt) => {
      const lessonKey = attempt.lessonKey as LessonKey;
      const ids = byLesson[lessonKey] ?? [];
      if (!ids.includes(attempt.exerciseId)) ids.push(attempt.exerciseId);
      byLesson[lessonKey] = ids;
      return byLesson;
    },
    {},
  );

  return buildLearnerOverview({
    learner,
    progress,
    completedLessonCount: completedLessons.length,
    completedExerciseIds,
  });
}
