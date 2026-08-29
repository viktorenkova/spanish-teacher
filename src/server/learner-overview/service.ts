import "server-only";
import { and, eq } from "drizzle-orm";
import { buildLearnerOverview } from "@/domain/learner-overview";
import type { LessonKey } from "@/domain/lesson";
import { getDatabase } from "@/server/db/client";
import { exerciseAttempts, lessonSessions } from "@/server/db/schema";
import { loadLearnerProgressSummary } from "@/server/review/service";

export async function loadLearnerOverview(learnerId: string) {
  const db = getDatabase();
  const [progress, correctAttempts, completedLessons] = await Promise.all([
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
    progress,
    completedLessonCount: completedLessons.length,
    completedExerciseIds,
  });
}
