export type ExerciseOption = {
  id: string;
  label: string;
};

export type LessonExercise = {
  id: string;
  learningItem: LearningItemDefinition;
  modality: "recognition" | "recall" | "listening" | "production";
  listeningClipId?: string;
  speakingTask?: {
    locale: "es-ES";
    maxDurationMs: number;
  };
  eyebrow: string;
  prompt: string;
  context: string;
  options: ExerciseOption[];
  correctOptionId: string;
  successFeedback: string;
  retryFeedback: string;
};

export type LessonKey = "introductions-v1" | "daily-routines-v1" | "cafe-ordering-v1";

export type LessonDefinition = {
  key: LessonKey;
  topic: "introductions" | "daily-routines" | "cafe-ordering";
  title: string;
  objective: string;
  completionTitle: string;
  completionSummary: string;
  exercises: LessonExercise[];
};

export type LearningItemDefinition = {
  id: string;
  kind: "word" | "phrase" | "construction" | "grammar_pattern";
  targetText: string;
  supportText: string;
  sourceType: "curated";
  sourceReference: string;
  license: "Project-authored";
  attribution: string;
  qaStatus: "reviewed";
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
    learningItem: {
      id: "phrase:encantada-introduction",
      kind: "phrase",
      targetText: "Encantada",
      supportText: "Pleased to meet you (said by a woman)",
      sourceType: "curated",
      sourceReference: "internal:mvp-introductions-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recognition",
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
    learningItem: {
      id: "construction:me-llamo",
      kind: "construction",
      targetText: "Me llamo…",
      supportText: "My name is…",
      sourceType: "curated",
      sourceReference: "internal:mvp-introductions-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recall",
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
    id: "listen-origin",
    learningItem: {
      id: "listening:introduction-lucia",
      kind: "phrase",
      targetText: "Hola, me llamo Lucía. Soy de Madrid.",
      supportText: "Hello, my name is Lucía. I am from Madrid.",
      sourceType: "curated",
      sourceReference: "internal:mvp-listening-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "listening",
    listeningClipId: "introduction-lucia",
    eyebrow: "Listen before reading",
    prompt: "Where is Lucía from?",
    context: "Play the audio. The English translation stays hidden.",
    options: [
      { id: "madrid", label: "Madrid" },
      { id: "london", label: "London" },
      { id: "barcelona", label: "Barcelona" },
    ],
    correctOptionId: "madrid",
    successFeedback: "Correct. You heard “Soy de Madrid.”",
    retryFeedback: "Listen again for the words after “Soy de…”.",
  },
  {
    id: "respond-origin",
    learningItem: {
      id: "construction:soy-de",
      kind: "construction",
      targetText: "Soy de…",
      supportText: "I am from…",
      sourceType: "curated",
      sourceReference: "internal:mvp-introductions-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recognition",
    eyebrow: "Prepare to speak",
    prompt: "Which answer matches “¿De dónde eres?”",
    context: "Keep the complete phrase in mind. You will use it aloud in the next step.",
    options: [
      { id: "origin", label: "Soy de Inglaterra." },
      { id: "name", label: "Me llamo Kate." },
      { id: "thanks", label: "Gracias." },
    ],
    correctOptionId: "origin",
    successFeedback: "Correct. “Soy de…” tells someone where you are from.",
    retryFeedback: "Listen for “de dónde”: it asks about where you are from.",
  },
  {
    id: "speak-introduction",
    learningItem: {
      id: "construction:spoken-introduction",
      kind: "construction",
      targetText: "Me llamo… Soy de…",
      supportText: "My name is… I am from…",
      sourceType: "curated",
      sourceReference: "internal:mvp-introductions-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "production",
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000 },
    eyebrow: "Speak in Spanish",
    prompt: "Introduce yourself aloud.",
    context:
      "Say your name and where you are from. Use: “Me llamo… Soy de…”\nYour transcript will be checked for task completion, not pronunciation.",
    options: [],
    correctOptionId: "task-complete",
    successFeedback:
      "Task complete: you included your name and where you are from. Pronunciation was not assessed.",
    retryFeedback: "Try again with both “Me llamo…” and “Soy de…”.",
  },
];

export const dailyRoutineLesson: LessonExercise[] = [
  {
    id: "meaning-me-levanto",
    learningItem: {
      id: "construction:me-levanto",
      kind: "construction",
      targetText: "Me levanto a las siete.",
      supportText: "I get up at seven.",
      sourceType: "curated",
      sourceReference: "internal:mvp-daily-routines-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recognition",
    eyebrow: "Understand in context",
    prompt: "What does “Me levanto a las siete” mean?",
    context: "— ¿A qué hora te levantas?\n— Me levanto a las siete.",
    options: [
      { id: "get-up", label: "I get up at seven" },
      { id: "eat", label: "I eat at seven" },
      { id: "leave", label: "I leave at seven" },
    ],
    correctOptionId: "get-up",
    successFeedback: "Correct. “Me levanto” is a useful way to say when you get up.",
    retryFeedback: "Look at the question “¿A qué hora te levantas?” It asks about getting up.",
  },
  {
    id: "retrieve-breakfast",
    learningItem: {
      id: "phrase:desayuno-por-la-manana",
      kind: "phrase",
      targetText: "Desayuno por la mañana.",
      supportText: "I have breakfast in the morning.",
      sourceType: "curated",
      sourceReference: "internal:mvp-daily-routines-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recall",
    eyebrow: "Retrieve the phrase",
    prompt: "Choose the natural way to say “I have breakfast in the morning.”",
    context: "You are describing a normal weekday.",
    options: [
      { id: "breakfast", label: "Desayuno por la mañana." },
      { id: "dinner", label: "Ceno por la mañana." },
      { id: "sleep", label: "Duermo por la mañana." },
    ],
    correctOptionId: "breakfast",
    successFeedback: "Good. “Desayuno” means “I have breakfast.”",
    retryFeedback: "Try the verb connected with desayuno: breakfast.",
  },
  {
    id: "listen-marta-routine",
    learningItem: {
      id: "listening:routine-marta",
      kind: "phrase",
      targetText: "Por la mañana, me levanto a las siete y desayuno.",
      supportText: "In the morning, I get up at seven and have breakfast.",
      sourceType: "curated",
      sourceReference: "internal:mvp-daily-routines-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "listening",
    listeningClipId: "routine-marta",
    eyebrow: "Listen for the time",
    prompt: "What time does Marta get up?",
    context: "Play the audio. Listen for the words after “a las”.",
    options: [
      { id: "seven", label: "At seven" },
      { id: "eight", label: "At eight" },
      { id: "nine", label: "At nine" },
    ],
    correctOptionId: "seven",
    successFeedback: "Correct. You heard “me levanto a las siete.”",
    retryFeedback: "Listen again for the number after “a las”.",
  },
  {
    id: "prepare-routine",
    learningItem: {
      id: "construction:routine-sequence",
      kind: "construction",
      targetText: "Me levanto… y desayuno.",
      supportText: "I get up… and have breakfast.",
      sourceType: "curated",
      sourceReference: "internal:mvp-daily-routines-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recognition",
    eyebrow: "Prepare to speak",
    prompt: "Which answer gives two parts of a morning routine?",
    context: "Keep the full sentence in mind. You will say your own version next.",
    options: [
      { id: "routine", label: "Me levanto a las siete y desayuno." },
      { id: "name", label: "Me llamo Marta y soy de Madrid." },
      { id: "cafe", label: "Quiero un café, por favor." },
    ],
    correctOptionId: "routine",
    successFeedback: "Correct. “Y” connects the two routine actions.",
    retryFeedback: "Choose the answer about getting up and having breakfast.",
  },
  {
    id: "speak-morning-routine",
    learningItem: {
      id: "construction:spoken-morning-routine",
      kind: "construction",
      targetText: "Me levanto a las… y desayuno.",
      supportText: "I get up at… and have breakfast.",
      sourceType: "curated",
      sourceReference: "internal:mvp-daily-routines-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "production",
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000 },
    eyebrow: "Speak in Spanish",
    prompt: "Describe your morning aloud.",
    context:
      "Say when you get up and that you have breakfast. Use: “Me levanto a las… y desayuno.”\nYour transcript will be checked for task completion, not pronunciation.",
    options: [],
    correctOptionId: "task-complete",
    successFeedback: "Task complete: you included getting up and having breakfast. Pronunciation was not assessed.",
    retryFeedback: "Try again with both “Me levanto…” and “desayuno”.",
  },
];

export const cafeOrderingLesson: LessonExercise[] = [
  {
    id: "meaning-quiero-cafe",
    learningItem: {
      id: "construction:quiero-cafe",
      kind: "construction",
      targetText: "Quiero un café.",
      supportText: "I would like a coffee.",
      sourceType: "curated",
      sourceReference: "internal:mvp-cafe-ordering-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recognition",
    eyebrow: "Understand in context",
    prompt: "What does the customer want?",
    context: "— Buenos días. ¿Qué quiere?\n— Quiero un café.",
    options: [
      { id: "coffee", label: "A coffee" },
      { id: "tea", label: "A tea" },
      { id: "sandwich", label: "A sandwich" },
    ],
    correctOptionId: "coffee",
    successFeedback: "Correct. “Quiero…” lets you state what you want.",
    retryFeedback: "Look at the noun after “Quiero un…”.",
  },
  {
    id: "retrieve-por-favor",
    learningItem: {
      id: "phrase:por-favor-cafe",
      kind: "phrase",
      targetText: "Un café, por favor.",
      supportText: "A coffee, please.",
      sourceType: "curated",
      sourceReference: "internal:mvp-cafe-ordering-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recall",
    eyebrow: "Retrieve the phrase",
    prompt: "Choose the polite cafe order.",
    context: "You are ordering one coffee at the counter.",
    options: [
      { id: "polite", label: "Un café, por favor." },
      { id: "origin", label: "Soy de un café." },
      { id: "routine", label: "Desayuno un café." },
    ],
    correctOptionId: "polite",
    successFeedback: "Good. “Por favor” makes the short order polite.",
    retryFeedback: "Choose the answer that names the drink and adds “please”.",
  },
  {
    id: "listen-cafe-order",
    learningItem: {
      id: "listening:cafe-order-ana",
      kind: "phrase",
      targetText: "Quiero un café con leche y agua, por favor.",
      supportText: "I would like a coffee with milk and water, please.",
      sourceType: "curated",
      sourceReference: "internal:mvp-cafe-ordering-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "listening",
    listeningClipId: "cafe-order-ana",
    eyebrow: "Listen for the order",
    prompt: "Which two drinks does Ana order?",
    context: "Play the audio. Listen for the words after “Quiero”.",
    options: [
      { id: "coffee-water", label: "Coffee with milk and water" },
      { id: "tea-water", label: "Tea and water" },
      { id: "two-coffees", label: "Two coffees" },
    ],
    correctOptionId: "coffee-water",
    successFeedback: "Correct. You heard “un café con leche y agua”.",
    retryFeedback: "Listen again for “café con leche” and the final drink.",
  },
  {
    id: "prepare-cafe-order",
    learningItem: {
      id: "construction:polite-cafe-order",
      kind: "construction",
      targetText: "Quiero…, por favor.",
      supportText: "I would like…, please.",
      sourceType: "curated",
      sourceReference: "internal:mvp-cafe-ordering-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recognition",
    eyebrow: "Prepare to speak",
    prompt: "Which answer is a complete polite order?",
    context: "Keep the whole construction in mind. You will make your own order next.",
    options: [
      { id: "order", label: "Quiero un café y agua, por favor." },
      { id: "question", label: "¿Quieres un café?" },
      { id: "introduction", label: "Me llamo Café." },
    ],
    correctOptionId: "order",
    successFeedback: "Correct. The answer includes the request, items, and “por favor”.",
    retryFeedback: "Choose the sentence a customer can say to order.",
  },
  {
    id: "speak-cafe-order",
    learningItem: {
      id: "construction:spoken-cafe-order",
      kind: "construction",
      targetText: "Quiero…, por favor.",
      supportText: "I would like…, please.",
      sourceType: "curated",
      sourceReference: "internal:mvp-cafe-ordering-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "production",
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000 },
    eyebrow: "Speak in Spanish",
    prompt: "Order two things aloud.",
    context:
      "Order a drink and one more item. Use: “Quiero… y…, por favor.”\nYour transcript will be checked for task completion, not pronunciation.",
    options: [],
    correctOptionId: "task-complete",
    successFeedback: "Task complete: you requested two items and used “por favor”. Pronunciation was not assessed.",
    retryFeedback: "Try again with “Quiero…” and “por favor”.",
  },
];

export const lessonCatalog: Record<LessonKey, LessonDefinition> = {
  "introductions-v1": {
    key: "introductions-v1",
    topic: "introductions",
    title: "Meet someone new",
    objective: "Say your name and where you are from.",
    completionTitle: "You can make a first introduction.",
    completionSummary:
      "You practised Me llamo…, Soy de…, and Encantada, listened for a place name, and completed a spoken introduction.",
    exercises: introductionLesson,
  },
  "daily-routines-v1": {
    key: "daily-routines-v1",
    topic: "daily-routines",
    title: "Talk about your morning",
    objective: "Say when you get up and connect two morning actions.",
    completionTitle: "You can describe a simple morning routine.",
    completionSummary:
      "You practised Me levanto…, a las…, and desayuno, listened for a time, and completed a spoken routine.",
    exercises: dailyRoutineLesson,
  },
  "cafe-ordering-v1": {
    key: "cafe-ordering-v1",
    topic: "cafe-ordering",
    title: "Order in a cafe",
    objective: "Order a drink and another item politely.",
    completionTitle: "You can make a simple cafe order.",
    completionSummary:
      "You practised Quiero…, café con leche, and por favor, listened for two drinks, and completed a spoken order.",
    exercises: cafeOrderingLesson,
  },
};

export function getLessonDefinition(key: string): LessonDefinition | undefined {
  return lessonCatalog[key as LessonKey];
}

export function getLearningItemDefinition(id: string): LearningItemDefinition | undefined {
  for (const lesson of Object.values(lessonCatalog)) {
    const item = lesson.exercises.find((exercise) => exercise.learningItem.id === id)?.learningItem;
    if (item) return item;
  }
  return undefined;
}

export type ReviewCandidate = {
  learningItem: LearningItemDefinition;
  reason: "due_review" | "learner_weakness";
};

export function createReviewExercise(
  candidate: ReviewCandidate,
  candidateIndex: number,
  reviewKey = "preview",
): LessonExercise {
  const distractors = Object.values(lessonCatalog)
    .flatMap((lesson) => lesson.exercises)
    .map((exercise) => exercise.learningItem)
    .filter((item) => item.id !== candidate.learningItem.id)
    .filter((item, index, items) => items.findIndex(({ id }) => id === item.id) === index)
    .slice(candidateIndex, candidateIndex + 2);

  return {
    id: `review:${candidate.learningItem.id}:${reviewKey}`,
    learningItem: candidate.learningItem,
    modality: "recall",
    eyebrow: candidate.reason === "learner_weakness" ? "Review a recurring pattern" : "Scheduled review",
    prompt: `Choose the Spanish for “${candidate.learningItem.supportText}”`,
    context: candidate.reason === "learner_weakness"
      ? "This pattern caused difficulty before. One calm retrieval helps make it more reliable."
      : "FSRS scheduled this phrase for retrieval now.",
    options: [
      { id: "review-correct", label: candidate.learningItem.targetText },
      ...distractors.map((item, index) => ({ id: `review-distractor-${index + 1}`, label: item.targetText })),
    ],
    correctOptionId: "review-correct",
    successFeedback: "Good retrieval. The review schedule has been updated.",
    retryFeedback: `Not yet. Look for the phrase that means “${candidate.learningItem.supportText}”.`,
  };
}

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
