import "server-only";
import { desc, eq } from "drizzle-orm";
import { introductionLesson } from "@/domain/lesson";
import { getDatabase } from "@/server/db/client";
import { teacherFeedback } from "@/server/db/schema";
import { updateMistakeMemory } from "@/server/mistakes/service";
import { recordSpeakingAttempt } from "@/server/review/service";
import { DeterministicTeacherProvider } from "@/teacher/deterministic-provider";
import type { TeacherFeedback } from "@/teacher/provider";

const provider = new DeterministicTeacherProvider();

export async function submitSpeakingAttemptWithTeacher(input: {
  learnerId: string;
  exerciseId: string;
  transcript: string;
  evidenceProvider: string;
  providerConfidence?: number;
}) {
  const exercise = introductionLesson.find((item) => item.id === input.exerciseId);
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
): Promise<TeacherFeedback | null> {
  const [stored] = await getDatabase()
    .select()
    .from(teacherFeedback)
    .where(eq(teacherFeedback.learnerId, learnerId))
    .orderBy(desc(teacherFeedback.createdAt))
    .limit(1);
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
