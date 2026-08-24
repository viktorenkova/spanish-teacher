import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { introductionLesson } from "@/domain/lesson";
import { getDatabase } from "@/server/db/client";
import {
  exerciseAttempts,
  learnerItemStates,
  learningItems,
} from "@/server/db/schema";
import { scheduleReview, storeCard } from "./scheduler";

export const introductionLessonKey = "introductions-v1";

export type PersistedLessonProgress = {
  completedExerciseIds: string[];
  correctAnswers: number;
  attempts: number;
  completedAt?: string;
};

export async function loadLessonProgress(learnerId: string): Promise<PersistedLessonProgress> {
  const db = getDatabase();
  const attempts = await db
    .select({
      exerciseId: exerciseAttempts.exerciseId,
      correct: exerciseAttempts.correct,
      occurredAt: exerciseAttempts.occurredAt,
    })
    .from(exerciseAttempts)
    .where(
      and(
        eq(exerciseAttempts.learnerId, learnerId),
        eq(exerciseAttempts.lessonKey, introductionLessonKey),
      ),
    )
    .orderBy(asc(exerciseAttempts.occurredAt));

  const completedExerciseIds = [
    ...new Set(attempts.filter((attempt) => attempt.correct).map((attempt) => attempt.exerciseId)),
  ];
  const isComplete = completedExerciseIds.length === introductionLesson.length;

  return {
    completedExerciseIds,
    correctAnswers: completedExerciseIds.length,
    attempts: attempts.length,
    completedAt: isComplete ? attempts.at(-1)?.occurredAt.toISOString() : undefined,
  };
}

export async function recordExerciseAttempt(input: {
  learnerId: string;
  exerciseId: string;
  selectedOptionId: string;
  now?: Date;
}) {
  const exercise = introductionLesson.find((item) => item.id === input.exerciseId);
  if (!exercise) throw new Error("Unknown exercise");

  const now = input.now ?? new Date();
  const correct = input.selectedOptionId === exercise.correctOptionId;
  const db = getDatabase();

  const scheduled = await db.transaction(async (transaction) => {
    await transaction
      .insert(learningItems)
      .values({
        id: exercise.learningItem.id,
        kind: exercise.learningItem.kind,
        targetText: exercise.learningItem.targetText,
        supportText: exercise.learningItem.supportText,
        sourceType: exercise.learningItem.sourceType,
        sourceReference: exercise.learningItem.sourceReference,
        license: exercise.learningItem.license,
        attribution: exercise.learningItem.attribution,
        qaStatus: exercise.learningItem.qaStatus,
      })
      .onConflictDoNothing();

    const [existing] = await transaction
      .select()
      .from(learnerItemStates)
      .where(
        and(
          eq(learnerItemStates.learnerId, input.learnerId),
          eq(learnerItemStates.learningItemId, exercise.learningItem.id),
        ),
      )
      .limit(1);

    const result = scheduleReview(existing, correct, now);
    const card = storeCard(result.card);
    const evidenceField =
      exercise.modality === "recognition"
        ? { recognitionEvidence: (existing?.recognitionEvidence ?? 0) + 1 }
        : exercise.modality === "recall"
          ? { recallEvidence: (existing?.recallEvidence ?? 0) + 1 }
          : exercise.modality === "listening"
            ? { listeningEvidence: (existing?.listeningEvidence ?? 0) + 1 }
            : { productionEvidence: (existing?.productionEvidence ?? 0) + 1 };

    await transaction
      .insert(learnerItemStates)
      .values({
        learnerId: input.learnerId,
        learningItemId: exercise.learningItem.id,
        ...card,
        ...evidenceField,
      })
      .onConflictDoUpdate({
        target: [learnerItemStates.learnerId, learnerItemStates.learningItemId],
        set: { ...card, ...evidenceField, updatedAt: now },
      });

    await transaction.insert(exerciseAttempts).values({
      learnerId: input.learnerId,
      learningItemId: exercise.learningItem.id,
      lessonKey: introductionLessonKey,
      exerciseId: exercise.id,
      modality: exercise.modality,
      selectedOptionId: input.selectedOptionId,
      correct,
      fsrsRating: result.rating,
      scheduledDue: result.card.due,
      occurredAt: now,
    });

    return { due: result.card.due, rating: result.rating };
  });

  return {
    correct,
    feedback: correct ? exercise.successFeedback : exercise.retryFeedback,
    nextReviewAt: scheduled.due.toISOString(),
    progress: await loadLessonProgress(input.learnerId),
  };
}

