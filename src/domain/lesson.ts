export type ExerciseOption = {
  id: string;
  label: string;
};

export type LessonExercise = {
  id: string;
  eyebrow: string;
  prompt: string;
  context: string;
  options: ExerciseOption[];
  correctOptionId: string;
  successFeedback: string;
  retryFeedback: string;
};

export type LessonProgress = {
  completedExerciseIds: string[];
  correctAnswers: number;
  attempts: number;
  completedAt?: string;
};

export const introductionLesson: LessonExercise[] = [
  {
    id: "meaning-encantada",
    eyebrow: "Understand in context",
    prompt: "What does Lucía mean by “Encantada”?",
    context: "— Hola, soy Lucía. ¿Cómo te llamas?\n— Me llamo Kate.\n— Encantada, Kate.",
    options: [
      { id: "pleased", label: "Pleased to meet you" },
      { id: "tomorrow", label: "See you tomorrow" },
      { id: "sorry", label: "I am sorry" },
    ],
    correctOptionId: "pleased",
    successFeedback: "Exactly. “Encantada” is used by a woman when she is pleased to meet someone.",
    retryFeedback: "Not quite. Look at the moment in the dialogue: two people have just introduced themselves.",
  },
  {
    id: "retrieve-name",
    eyebrow: "Retrieve the phrase",
    prompt: "Choose the natural answer to “¿Cómo te llamas?”",
    context: "You are meeting someone for the first time.",
    options: [
      { id: "name", label: "Me llamo Kate." },
      { id: "fine", label: "Estoy bien." },
      { id: "from", label: "Soy de Inglaterra." },
    ],
    correctOptionId: "name",
    successFeedback: "Good. “Me llamo…” is the useful pattern for giving your name.",
    retryFeedback: "Try again. The question asks for your name, not how you feel or where you are from.",
  },
  {
    id: "respond-origin",
    eyebrow: "Prepare to speak",
    prompt: "Which answer matches “¿De dónde eres?”",
    context: "Keep the complete phrase in mind. A speaking turn will be added in the speech slice.",
    options: [
      { id: "origin", label: "Soy de Inglaterra." },
      { id: "name", label: "Me llamo Kate." },
      { id: "thanks", label: "Gracias." },
    ],
    correctOptionId: "origin",
    successFeedback: "Correct. “Soy de…” tells someone where you are from.",
    retryFeedback: "Listen for “de dónde”: it asks about where you are from.",
  },
];

export function createEmptyProgress(): LessonProgress {
  return { completedExerciseIds: [], correctAnswers: 0, attempts: 0 };
}

export function recordAnswer(
  progress: LessonProgress,
  exercise: LessonExercise,
  selectedOptionId: string,
): LessonProgress {
  const isCorrect = selectedOptionId === exercise.correctOptionId;
  const wasCompleted = progress.completedExerciseIds.includes(exercise.id);

  return {
    ...progress,
    attempts: progress.attempts + 1,
    correctAnswers: progress.correctAnswers + (isCorrect && !wasCompleted ? 1 : 0),
    completedExerciseIds:
      isCorrect && !wasCompleted
        ? [...progress.completedExerciseIds, exercise.id]
        : progress.completedExerciseIds,
    completedAt:
      isCorrect && !wasCompleted && progress.completedExerciseIds.length + 1 === introductionLesson.length
        ? new Date().toISOString()
        : progress.completedAt,
  };
}

