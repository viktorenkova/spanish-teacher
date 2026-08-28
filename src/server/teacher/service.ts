import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getLessonDefinition, type LessonKey } from "@/domain/lesson";
import { getDatabase } from "@/server/db/client";
import { exerciseAttempts, teacherFeedback } from "@/server/db/schema";
import { updateMistakeMemory } from "@/server/mistakes/service";
import { recordSpeakingAttempt } from "@/server/review/service";
import { DeterministicTeacherProvider } from "@/teacher/deterministic-provider";
import type { TeacherFeedback } from "@/teacher/provider";

const provider = new DeterministicTeacherProvider();

export async function submitSpeakingAttemptWithTeacher(input: {
  learnerId: string;
  lessonKey: LessonKey;
  exerciseId: string;
  transcript: string;
  evidenceProvider: string;
  providerConfidence?: number;
}) {
  const exercise = getLessonDefinition(input.lessonKey)?.exercises.find(
    (item) => item.id === input.exerciseId,
  );
  if (!exercise?.speakingTask) throw new Error("Unknown speaking exercise");

  const attempt = await recordSpeakingAttempt(input);
  const generated = await provider.generateFeedback({
    transcript: input.transcript,
    objective: exercise.prompt,
    assessment: attempt.assessment,
    targetLocale: "es-ES",
    targetLevel: "A1",
    supportLanguage: "en",
    supportLevel: "B1",
  });

  await getDatabase().insert(teacherFeedback).values({
    learnerId: input.learnerId,
    exerciseAttemptId: attempt.attemptId,
    providerId: generated.providerId,
    providerVersion: generated.providerVersion,
    generationMode: generated.generationMode,
    content: {
      summary: generated.summary,
      praise: generated.praise,
      corrections: generated.corrections,
      nextStep: generated.nextStep,
    },
  });

  const mistakeMemory = await updateMistakeMemory({
    learnerId: input.learnerId,
    learningItemId: exercise.learningItem.id,
    exerciseAttemptId: attempt.attemptId,
    corrections: generated.corrections,
    taskComplete: attempt.correct,
  });

  return { ...attempt, teacherFeedback: generated, mistakeMemory };
}

export async function loadLatestTeacherFeedback(
  learnerId: string,
  lessonKey?: LessonKey,
): Promise<TeacherFeedback | null> {
  const [joined] = await getDatabase()
    .select()
    .from(teacherFeedback)
    .innerJoin(exerciseAttempts, eq(teacherFeedback.exerciseAttemptId, exerciseAttempts.id))
    .where(
      lessonKey
        ? and(
            eq(teacherFeedback.learnerId, learnerId),
            eq(exerciseAttempts.lessonKey, lessonKey),
          )
        : eq(teacherFeedback.learnerId, learnerId),
    )
    .orderBy(desc(teacherFeedback.createdAt))
    .limit(1);
  const stored = joined?.teacher_feedback;
  if (!stored) return null;

  return {
    summary: stored.content.summary,
    praise: stored.content.praise,
    corrections: stored.content.corrections as TeacherFeedback["corrections"],
    nextStep: stored.content.nextStep,
    providerId: stored.providerId,
    providerVersion: stored.providerVersion,
    generationMode: stored.generationMode as TeacherFeedback["generationMode"],
  };
}
