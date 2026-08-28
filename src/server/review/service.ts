import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { summariseLearnerProgress, type LearnerProgressSummary } from "@/domain/progress";
import { getLessonDefinition, type LessonExercise, type LessonKey } from "@/domain/lesson";
import { assessIntroductionTranscript, assessMorningRoutineTranscript } from "@/domain/speaking";
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

export async function loadLessonProgress(
  learnerId: string,
  lessonKey: LessonKey = introductionLessonKey,
): Promise<PersistedLessonProgress> {
  const lesson = getLessonDefinition(lessonKey);
  if (!lesson) throw new Error("Unknown lesson");
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
        eq(exerciseAttempts.lessonKey, lessonKey),
      ),
    )
    .orderBy(asc(exerciseAttempts.occurredAt));

  const completedExerciseIds = [
    ...new Set(attempts.filter((attempt) => attempt.correct).map((attempt) => attempt.exerciseId)),
  ];
  const isComplete = completedExerciseIds.length === lesson.exercises.length;

  return {
    completedExerciseIds,
    correctAnswers: completedExerciseIds.length,
    attempts: attempts.length,
    completedAt: isComplete ? attempts.at(-1)?.occurredAt.toISOString() : undefined,
  };
}

export async function loadLearnerProgressSummary(
  learnerId: string,
  now = new Date(),
): Promise<LearnerProgressSummary> {
  const db = getDatabase();
  const [itemStates, evidence] = await Promise.all([
    db
      .select({ learningItemId: learnerItemStates.learningItemId, due: learnerItemStates.due })
      .from(learnerItemStates)
      .where(eq(learnerItemStates.learnerId, learnerId)),
    db
      .select({
        learningItemId: exerciseAttempts.learningItemId,
        modality: exerciseAttempts.modality,
        correct: exerciseAttempts.correct,
        occurredAt: exerciseAttempts.occurredAt,
      })
      .from(exerciseAttempts)
      .where(eq(exerciseAttempts.learnerId, learnerId)),
  ]);

  return summariseLearnerProgress({ itemStates, evidence, now });
}

type PersistedAttemptInput = {
  learnerId: string;
  lessonKey: LessonKey;
  exerciseId: string;
  selectedOptionId: string;
  transcript?: string;
  evidenceProvider?: string;
  providerConfidence?: number;
  assessmentVersion?: string;
  now?: Date;
};

async function persistExerciseAttempt(
  input: PersistedAttemptInput,
  exercise: LessonExercise,
  correct: boolean,
  feedback: string,
) {
  const now = input.now ?? new Date();
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

    const [storedAttempt] = await transaction
      .insert(exerciseAttempts)
      .values({
        learnerId: input.learnerId,
        learningItemId: exercise.learningItem.id,
        lessonKey: input.lessonKey,
        exerciseId: exercise.id,
        modality: exercise.modality,
        selectedOptionId: input.selectedOptionId,
        transcript: input.transcript,
        evidenceProvider: input.evidenceProvider,
        providerConfidence: input.providerConfidence,
        assessmentVersion: input.assessmentVersion,
        correct,
        fsrsRating: result.rating,
        scheduledDue: result.card.due,
        occurredAt: now,
      })
      .returning({ id: exerciseAttempts.id });

    return { due: result.card.due, rating: result.rating, attemptId: storedAttempt.id };
  });

  return {
    correct,
    feedback,
    attemptId: scheduled.attemptId,
    nextReviewAt: scheduled.due.toISOString(),
    progress: await loadLessonProgress(input.learnerId, input.lessonKey),
  };
}

export async function recordExerciseAttempt(input: PersistedAttemptInput) {
  const exercise = getLessonDefinition(input.lessonKey)?.exercises.find(
    (item) => item.id === input.exerciseId,
  );
  if (!exercise) throw new Error("Unknown exercise");
  if (exercise.modality === "production") throw new Error("Speaking task requires transcript evidence");

  const correct = input.selectedOptionId === exercise.correctOptionId;
  return persistExerciseAttempt(
    input,
    exercise,
    correct,
    correct ? exercise.successFeedback : exercise.retryFeedback,
  );
}

export async function recordSpeakingAttempt(input: {
  learnerId: string;
  lessonKey: LessonKey;
  exerciseId: string;
  transcript: string;
  evidenceProvider: string;
  providerConfidence?: number;
  now?: Date;
}) {
  const exercise = getLessonDefinition(input.lessonKey)?.exercises.find(
    (item) => item.id === input.exerciseId,
  );
  if (!exercise || exercise.modality !== "production" || !exercise.speakingTask) {
    throw new Error("Unknown speaking exercise");
  }

  const assessment = input.lessonKey === "daily-routines-v1"
    ? assessMorningRoutineTranscript(input.transcript)
    : assessIntroductionTranscript(input.transcript);
  const result = await persistExerciseAttempt(
    {
      ...input,
      selectedOptionId: assessment.complete ? "task-complete" : "task-retry",
      assessmentVersion: assessment.version,
    },
    exercise,
    assessment.complete,
    assessment.feedback,
  );
  return { ...result, assessment };
}
