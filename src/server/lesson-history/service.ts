import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { buildLessonHistory } from "@/domain/lesson-history";
import type { LessonKey } from "@/domain/lesson";
import { getDatabase } from "@/server/db/client";
import { exerciseAttempts, lessonSessions } from "@/server/db/schema";

export async function loadLessonHistory(learnerId: string) {
  const db = getDatabase();
  const sessions = await db
    .select({
      id: lessonSessions.id,
      lessonKey: lessonSessions.lessonKey,
      startedAt: lessonSessions.startedAt,
      completedAt: lessonSessions.completedAt,
    })
    .from(lessonSessions)
    .where(and(
      eq(lessonSessions.learnerId, learnerId),
      eq(lessonSessions.status, "completed"),
    ))
    .orderBy(desc(lessonSessions.completedAt))
    .limit(10);

  if (sessions.length === 0) return [];

  const attempts = await db
    .select({
      lessonSessionId: exerciseAttempts.lessonSessionId,
      correct: exerciseAttempts.correct,
      modality: exerciseAttempts.modality,
    })
    .from(exerciseAttempts)
    .where(inArray(exerciseAttempts.lessonSessionId, sessions.map(({ id }) => id)));

  return buildLessonHistory(sessions.flatMap((session) => {
    if (!session.completedAt) return [];
    return [{
      id: session.id,
      lessonKey: session.lessonKey as LessonKey,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      attempts: attempts
        .filter(({ lessonSessionId }) => lessonSessionId === session.id)
        .map(({ correct, modality }) => ({ correct, modality })),
    }];
  }));
}
