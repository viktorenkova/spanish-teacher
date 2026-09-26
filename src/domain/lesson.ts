import type { SpeakingAssessorId } from "./speaking";

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
    assessorId: SpeakingAssessorId;
  };
  eyebrow: string;
  prompt: string;
  context: string;
  options: ExerciseOption[];
  correctOptionId: string;
  successFeedback: string;
  retryFeedback: string;
};

export type LessonTeachingModule = {
  id: string;
  beforeExerciseId: string;
  focus: string;
  phrases: { spanish: string; english: string }[];
  example: { spanish: string; english: string };
};

export type ExerciseCoaching = {
  notice: string;
  targetPhrase: string;
  explanation: string;
  transferPrompt: string;
};

export function getExerciseCoaching(exercise: LessonExercise): ExerciseCoaching | undefined {
  if (exercise.modality === "production") return undefined;

  const transferPrompt = exercise.modality === "listening"
    ? `Listen for “${exercise.learningItem.targetText}” again, then imagine hearing it in a different short conversation.`
    : exercise.modality === "recall"
      ? `Say “${exercise.learningItem.targetText}” once without looking, then imagine using it with a different person or place.`
      : `Imagine a new situation where “${exercise.learningItem.targetText}” would have the same meaning.`;

  return {
    notice: exercise.retryFeedback,
    targetPhrase: exercise.learningItem.targetText,
    explanation: `“${exercise.learningItem.targetText}” means “${exercise.learningItem.supportText}”. Focus on this meaning before you try again.`,
    transferPrompt,
  };
}

export const lessonKeys = [
  "introductions-v1",
  "daily-routines-v1",
  "cafe-ordering-v1",
  "shopping-v1",
  "directions-v1",
  "transport-v1",
  "hotel-checkin-v1",
  "restaurant-v1",
  "family-v1",
  "free-time-v1",
  "making-plans-v1",
  "weather-v1",
] as const;

export type LessonKey = (typeof lessonKeys)[number];

export function isLessonKey(value: string): value is LessonKey {
  return lessonKeys.includes(value as LessonKey);
}

export type LessonDefinition = {
  key: LessonKey;
  topic:
    | "introductions"
    | "daily-routines"
    | "cafe-ordering"
    | "shopping"
    | "directions"
    | "transport"
    | "hotel-checkin"
    | "restaurant"
    | "family"
    | "free-time"
    | "making-plans"
    | "weather";
  title: string;
  objective: string;
  completionTitle: string;
  completionSummary: string;
  planner: {
    listeningObjective: string;
    speakingTitle: string;
    speakingObjective: string;
    progressionReason: string;
  };
  teachingModules: LessonTeachingModule[];
  exercises: LessonExercise[];
};

export function getLessonRecallItems(lesson: LessonDefinition, limit = 3): LearningItemDefinition[] {
  return Array.from(
    new Map(
      lesson.exercises.map((exercise) => [exercise.learningItem.id, exercise.learningItem]),
    ).values(),
  ).slice(0, Math.max(0, limit));
}

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
  hasSpokenEvidence?: boolean;
};

function projectAuthoredItem(
  id: string,
  kind: LearningItemDefinition["kind"],
  targetText: string,
  supportText: string,
  sourceReference: string,
): LearningItemDefinition {
  return {
    id,
    kind,
    targetText,
    supportText,
    sourceType: "curated",
    sourceReference,
    license: "Project-authored",
    attribution: "Spanish Coach",
    qaStatus: "reviewed",
  };
}

type CompactLessonSpec = {
  sourceReference: string;
  recognition: {
    id: string;
    itemId: string;
    targetText: string;
    supportText: string;
    prompt: string;
    context: string;
    options: ExerciseOption[];
    correctOptionId: string;
    successFeedback: string;
    retryFeedback: string;
  };
  recall: {
    id: string;
    itemId: string;
    targetText: string;
    supportText: string;
    prompt: string;
    context: string;
    options: ExerciseOption[];
    correctOptionId: string;
    successFeedback: string;
    retryFeedback: string;
  };
  listening: {
    id: string;
    itemId: string;
    clipId: string;
    targetText: string;
    supportText: string;
    prompt: string;
    context: string;
    options: ExerciseOption[];
    correctOptionId: string;
    successFeedback: string;
    retryFeedback: string;
  };
  speaking: {
    id: string;
    itemId: string;
    targetText: string;
    supportText: string;
    assessorId: SpeakingAssessorId;
    prompt: string;
    context: string;
    successFeedback: string;
    retryFeedback: string;
  };
};

function createCompactLesson(spec: CompactLessonSpec): LessonExercise[] {
  return [
    {
      id: spec.recognition.id,
      learningItem: projectAuthoredItem(
        spec.recognition.itemId,
        "phrase",
        spec.recognition.targetText,
        spec.recognition.supportText,
        spec.sourceReference,
      ),
      modality: "recognition",
      eyebrow: "Understand in context",
      prompt: spec.recognition.prompt,
      context: spec.recognition.context,
      options: spec.recognition.options,
      correctOptionId: spec.recognition.correctOptionId,
      successFeedback: spec.recognition.successFeedback,
      retryFeedback: spec.recognition.retryFeedback,
    },
    {
      id: spec.recall.id,
      learningItem: projectAuthoredItem(
        spec.recall.itemId,
        "construction",
        spec.recall.targetText,
        spec.recall.supportText,
        spec.sourceReference,
      ),
      modality: "recall",
      eyebrow: "Retrieve the phrase",
      prompt: spec.recall.prompt,
      context: spec.recall.context,
      options: spec.recall.options,
      correctOptionId: spec.recall.correctOptionId,
      successFeedback: spec.recall.successFeedback,
      retryFeedback: spec.recall.retryFeedback,
    },
    {
      id: spec.listening.id,
      learningItem: projectAuthoredItem(
        spec.listening.itemId,
        "phrase",
        spec.listening.targetText,
        spec.listening.supportText,
        spec.sourceReference,
      ),
      modality: "listening",
      listeningClipId: spec.listening.clipId,
      eyebrow: "Listen for the key detail",
      prompt: spec.listening.prompt,
      context: spec.listening.context,
      options: spec.listening.options,
      correctOptionId: spec.listening.correctOptionId,
      successFeedback: spec.listening.successFeedback,
      retryFeedback: spec.listening.retryFeedback,
    },
    {
      id: spec.speaking.id,
      learningItem: projectAuthoredItem(
        spec.speaking.itemId,
        "construction",
        spec.speaking.targetText,
        spec.speaking.supportText,
        spec.sourceReference,
      ),
      modality: "production",
      speakingTask: { locale: "es-ES", maxDurationMs: 15_000, assessorId: spec.speaking.assessorId },
      eyebrow: "Speak in Spanish",
      prompt: spec.speaking.prompt,
      context: `${spec.speaking.context}\nYour transcript will be checked for task completion, not pronunciation.`,
      options: [],
      correctOptionId: "task-complete",
      successFeedback: spec.speaking.successFeedback,
      retryFeedback: spec.speaking.retryFeedback,
    },
  ];
}

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
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000, assessorId: "introduction" },
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
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000, assessorId: "morning-routine" },
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
    id: "understand-cafe-without",
    learningItem: {
      id: "construction:cafe-con-sin",
      kind: "construction",
      targetText: "Un café con leche, sin azúcar.",
      supportText: "A coffee with milk, without sugar.",
      sourceType: "curated",
      sourceReference: "internal:mvp-cafe-ordering-v1",
      license: "Project-authored",
      attribution: "Spanish Coach",
      qaStatus: "reviewed",
    },
    modality: "recognition",
    listeningClipId: "cafe-con-sin",
    eyebrow: "Learn before you listen",
    prompt: "What does the customer want in the coffee?",
    context: "A customer orders a coffee with one addition and without another. Choose what they want.",
    options: [
      { id: "milk-no-sugar", label: "Milk, but no sugar" },
      { id: "sugar-no-milk", label: "Sugar, but no milk" },
      { id: "milk-and-sugar", label: "Milk and sugar" },
    ],
    correctOptionId: "milk-no-sugar",
    successFeedback: "Yes. Con leche means with milk; sin azúcar means without sugar.",
    retryFeedback: "Con means with; sin means without. Look at the example once more.",
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
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000, assessorId: "cafe-order" },
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

export const shoppingLesson: LessonExercise[] = [
  {
    id: "meaning-medio-kilo",
    learningItem: projectAuthoredItem(
      "construction:medio-kilo-de",
      "construction",
      "Medio kilo de tomates, por favor.",
      "Half a kilo of tomatoes, please.",
      "internal:mvp-shopping-v1",
    ),
    modality: "recognition",
    eyebrow: "Understand a useful quantity",
    prompt: "What does the customer ask for?",
    context: "— Buenos días. ¿Qué le pongo?\n— Medio kilo de tomates, por favor.",
    options: [
      { id: "half-kilo", label: "Half a kilo of tomatoes" },
      { id: "one-tomato", label: "One tomato" },
      { id: "two-kilos", label: "Two kilos of tomatoes" },
    ],
    correctOptionId: "half-kilo",
    successFeedback: "Correct. “Medio kilo de…” is useful for buying food by weight.",
    retryFeedback: "Look at “medio kilo”: it means half a kilo.",
  },
  {
    id: "retrieve-price-question",
    learningItem: projectAuthoredItem(
      "construction:cuanto-cuesta",
      "construction",
      "¿Cuánto cuesta?",
      "How much does it cost?",
      "internal:mvp-shopping-v1",
    ),
    modality: "recall",
    eyebrow: "Ask the price",
    prompt: "Choose the natural way to ask the price.",
    context: "You have chosen something in a small shop.",
    options: [
      { id: "price", label: "¿Cuánto cuesta?" },
      { id: "place", label: "¿Dónde está?" },
      { id: "time", label: "¿Qué hora es?" },
    ],
    correctOptionId: "price",
    successFeedback: "Good. “¿Cuánto cuesta?” asks how much one thing costs.",
    retryFeedback: "Choose the question with “cuánto”, which asks about an amount.",
  },
  {
    id: "listen-market-price",
    learningItem: projectAuthoredItem(
      "listening:market-apples",
      "phrase",
      "Un kilo de manzanas cuesta tres euros.",
      "One kilo of apples costs three euros.",
      "internal:mvp-shopping-v1",
    ),
    modality: "listening",
    listeningClipId: "market-apples",
    eyebrow: "Listen for the price",
    prompt: "How much is one kilo of apples?",
    context: "Play the audio and listen for the number before “euros”.",
    options: [
      { id: "three", label: "Three euros" },
      { id: "two", label: "Two euros" },
      { id: "five", label: "Five euros" },
    ],
    correctOptionId: "three",
    successFeedback: "Correct. You heard “tres euros”.",
    retryFeedback: "Listen again for the price at the end of the sentence.",
  },
  {
    id: "speak-shopping",
    learningItem: projectAuthoredItem(
      "construction:spoken-shopping",
      "construction",
      "Quiero medio kilo de… ¿Cuánto cuesta?",
      "I would like half a kilo of… How much does it cost?",
      "internal:mvp-shopping-v1",
    ),
    modality: "production",
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000, assessorId: "shopping" },
    eyebrow: "Speak in Spanish",
    prompt: "Buy some food and ask the price.",
    context:
      "Say a quantity and a product, then ask the price. Example: “Quiero medio kilo de tomates. ¿Cuánto cuesta?”\nYour transcript will be checked for task completion, not pronunciation.",
    options: [],
    correctOptionId: "task-complete",
    successFeedback: "Task complete: you asked for a quantity and asked the price.",
    retryFeedback: "Try again with a quantity, a product, and “¿Cuánto cuesta?”.",
  },
];

export const directionsLesson: LessonExercise[] = [
  {
    id: "meaning-todo-recto",
    learningItem: projectAuthoredItem(
      "phrase:todo-recto",
      "phrase",
      "Todo recto.",
      "Straight ahead.",
      "internal:mvp-directions-v1",
    ),
    modality: "recognition",
    eyebrow: "Understand directions",
    prompt: "What does “Todo recto” tell you to do?",
    context: "— Perdona, ¿dónde está la estación?\n— Todo recto y luego a la derecha.",
    options: [
      { id: "straight", label: "Go straight ahead" },
      { id: "left", label: "Turn left now" },
      { id: "stop", label: "Stop here" },
    ],
    correctOptionId: "straight",
    successFeedback: "Correct. “Todo recto” means straight ahead.",
    retryFeedback: "The phrase describes continuing forward without turning.",
  },
  {
    id: "retrieve-where-is",
    learningItem: projectAuthoredItem(
      "construction:donde-esta",
      "construction",
      "¿Dónde está la estación?",
      "Where is the station?",
      "internal:mvp-directions-v1",
    ),
    modality: "recall",
    eyebrow: "Ask for a place",
    prompt: "Choose the question for finding the station.",
    context: "You are in a new city and need directions.",
    options: [
      { id: "where", label: "¿Dónde está la estación?" },
      { id: "price", label: "¿Cuánto cuesta la estación?" },
      { id: "name", label: "¿Cómo te llamas, estación?" },
    ],
    correctOptionId: "where",
    successFeedback: "Good. “¿Dónde está…?” is a simple A1 pattern for asking where a place is.",
    retryFeedback: "Use “dónde” when you ask where something is.",
  },
  {
    id: "listen-directions-station",
    learningItem: projectAuthoredItem(
      "listening:directions-station",
      "phrase",
      "La estación está a la derecha, después del banco.",
      "The station is on the right, after the bank.",
      "internal:mvp-directions-v1",
    ),
    modality: "listening",
    listeningClipId: "directions-station",
    eyebrow: "Listen for left or right",
    prompt: "Where is the station?",
    context: "Play the audio and listen for “derecha” or “izquierda”.",
    options: [
      { id: "right", label: "On the right" },
      { id: "left", label: "On the left" },
      { id: "behind", label: "Behind you" },
    ],
    correctOptionId: "right",
    successFeedback: "Correct. You heard “a la derecha”.",
    retryFeedback: "Listen again for the direction after “está”.",
  },
  {
    id: "speak-directions",
    learningItem: projectAuthoredItem(
      "construction:spoken-directions-question",
      "construction",
      "Perdona, ¿dónde está…?",
      "Excuse me, where is…?",
      "internal:mvp-directions-v1",
    ),
    modality: "production",
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000, assessorId: "directions" },
    eyebrow: "Speak in Spanish",
    prompt: "Ask someone how to find a place.",
    context:
      "Ask for a real place such as a station, pharmacy, museum, hotel, metro, or plaza. Example: “Perdona, ¿dónde está la estación?”",
    options: [],
    correctOptionId: "task-complete",
    successFeedback: "Task complete: you asked where a place is.",
    retryFeedback: "Try again with “¿Dónde está…?” or “¿Cómo llego a…?”.",
  },
];

export const transportLesson: LessonExercise[] = [
  {
    id: "meaning-ida-vuelta",
    learningItem: projectAuthoredItem(
      "phrase:ida-y-vuelta",
      "phrase",
      "Ida y vuelta.",
      "Return ticket / there and back.",
      "internal:mvp-transport-v1",
    ),
    modality: "recognition",
    eyebrow: "Understand ticket language",
    prompt: "What kind of journey is “ida y vuelta”?",
    context: "— ¿Solo ida?\n— No, ida y vuelta, por favor.",
    options: [
      { id: "return", label: "A return journey" },
      { id: "single", label: "A one-way journey" },
      { id: "walking", label: "A walking route" },
    ],
    correctOptionId: "return",
    successFeedback: "Correct. “Ida y vuelta” means going there and coming back.",
    retryFeedback: "“Vuelta” is the return part of the journey.",
  },
  {
    id: "retrieve-ticket",
    learningItem: projectAuthoredItem(
      "construction:billete-para",
      "construction",
      "Un billete para Toledo, por favor.",
      "One ticket to Toledo, please.",
      "internal:mvp-transport-v1",
    ),
    modality: "recall",
    eyebrow: "Buy a ticket",
    prompt: "Choose the natural sentence for buying one ticket to Toledo.",
    context: "You are at a train or bus ticket desk.",
    options: [
      { id: "ticket", label: "Un billete para Toledo, por favor." },
      { id: "from", label: "Soy de Toledo, por favor." },
      { id: "where", label: "¿Dónde Toledo?" },
    ],
    correctOptionId: "ticket",
    successFeedback: "Good. “Un billete para…” is a useful travel pattern.",
    retryFeedback: "Look for the sentence with “billete” and the destination after “para”.",
  },
  {
    id: "listen-train-time",
    learningItem: projectAuthoredItem(
      "listening:train-valencia",
      "phrase",
      "El tren para Valencia sale a las nueve y media.",
      "The train to Valencia leaves at half past nine.",
      "internal:mvp-transport-v1",
    ),
    modality: "listening",
    listeningClipId: "train-valencia",
    eyebrow: "Listen for departure time",
    prompt: "What time does the train leave?",
    context: "Play the audio and listen for the time after “sale a las”.",
    options: [
      { id: "nine-thirty", label: "9:30" },
      { id: "nine", label: "9:00" },
      { id: "ten-thirty", label: "10:30" },
    ],
    correctOptionId: "nine-thirty",
    successFeedback: "Correct. “Las nueve y media” is 9:30.",
    retryFeedback: "Listen again for “nueve y media”.",
  },
  {
    id: "speak-ticket",
    learningItem: projectAuthoredItem(
      "construction:spoken-ticket",
      "construction",
      "Un billete para…, por favor.",
      "One ticket to…, please.",
      "internal:mvp-transport-v1",
    ),
    modality: "production",
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000, assessorId: "transport" },
    eyebrow: "Speak in Spanish",
    prompt: "Buy a ticket to a Spanish city.",
    context:
      "Choose Madrid, Barcelona, Valencia, Sevilla, Málaga, Toledo, or Granada. Example: “Un billete para Toledo, por favor.”",
    options: [],
    correctOptionId: "task-complete",
    successFeedback: "Task complete: you requested a ticket and gave a destination.",
    retryFeedback: "Try again with “Un billete para…” and a city.",
  },
];

export const hotelCheckinLesson: LessonExercise[] = [
  {
    id: "meaning-reserva",
    learningItem: projectAuthoredItem(
      "construction:tengo-una-reserva",
      "construction",
      "Tengo una reserva.",
      "I have a reservation.",
      "internal:mvp-hotel-checkin-v1",
    ),
    modality: "recognition",
    eyebrow: "Understand check-in language",
    prompt: "What does the guest mean by “Tengo una reserva”?",
    context: "— Buenas tardes.\n— Hola. Tengo una reserva.",
    options: [
      { id: "reservation", label: "I have a reservation" },
      { id: "room", label: "I need to clean the room" },
      { id: "leave", label: "I am leaving now" },
    ],
    correctOptionId: "reservation",
    successFeedback: "Correct. This is a direct and useful phrase at hotel reception.",
    retryFeedback: "“Reserva” means reservation or booking.",
  },
  {
    id: "retrieve-booking-name",
    learningItem: projectAuthoredItem(
      "construction:a-nombre-de",
      "construction",
      "A nombre de García.",
      "Under the name García.",
      "internal:mvp-hotel-checkin-v1",
    ),
    modality: "recall",
    eyebrow: "Give the booking name",
    prompt: "Choose the natural phrase for giving the name on a reservation.",
    context: "Reception asks: “¿A nombre de quién?”",
    options: [
      { id: "name", label: "A nombre de García." },
      { id: "origin", label: "Soy de García." },
      { id: "price", label: "Cuesta García." },
    ],
    correctOptionId: "name",
    successFeedback: "Good. “A nombre de…” gives the name used for a booking.",
    retryFeedback: "Use the phrase that contains “nombre”.",
  },
  {
    id: "listen-room-number",
    learningItem: projectAuthoredItem(
      "listening:hotel-room-214",
      "phrase",
      "Su habitación es la doscientos catorce, en la segunda planta.",
      "Your room is 214, on the second floor.",
      "internal:mvp-hotel-checkin-v1",
    ),
    modality: "listening",
    listeningClipId: "hotel-room-214",
    eyebrow: "Listen for the room number",
    prompt: "What is the room number?",
    context: "Play the audio and listen for the number after “habitación”.",
    options: [
      { id: "214", label: "214" },
      { id: "204", label: "204" },
      { id: "240", label: "240" },
    ],
    correctOptionId: "214",
    successFeedback: "Correct. You heard “doscientos catorce”.",
    retryFeedback: "Listen again to the number after “es la”.",
  },
  {
    id: "speak-hotel-checkin",
    learningItem: projectAuthoredItem(
      "construction:spoken-hotel-checkin",
      "construction",
      "Tengo una reserva a nombre de…",
      "I have a reservation under the name…",
      "internal:mvp-hotel-checkin-v1",
    ),
    modality: "production",
    speakingTask: { locale: "es-ES", maxDurationMs: 15_000, assessorId: "hotel-checkin" },
    eyebrow: "Speak in Spanish",
    prompt: "Check in at a hotel.",
    context:
      "Say that you have a reservation and give the booking name. Example: “Tengo una reserva a nombre de García.”",
    options: [],
    correctOptionId: "task-complete",
    successFeedback: "Task complete: you mentioned the reservation and the booking name.",
    retryFeedback: "Try again with “Tengo una reserva” and “a nombre de…”.",
  },
];

export const restaurantLesson = createCompactLesson({
  sourceReference: "internal:mvp-restaurant-v1",
  recognition: {
    id: "meaning-la-cuenta",
    itemId: "phrase:la-cuenta-por-favor",
    targetText: "La cuenta, por favor.",
    supportText: "The bill, please.",
    prompt: "What is the customer asking for?",
    context: "— ¿Algo más?\n— La cuenta, por favor.",
    options: [
      { id: "bill", label: "The bill" },
      { id: "menu", label: "The menu" },
      { id: "water", label: "Water" },
    ],
    correctOptionId: "bill",
    successFeedback: "Correct. “La cuenta, por favor” is the standard way to ask for the bill.",
    retryFeedback: "“La cuenta” means the bill.",
  },
  recall: {
    id: "retrieve-restaurant-order",
    itemId: "construction:para-mi-tortilla",
    targetText: "Para mí, la tortilla.",
    supportText: "For me, the tortilla.",
    prompt: "Choose the natural phrase to order a dish for yourself.",
    context: "The waiter asks what you would like to eat.",
    options: [
      { id: "order", label: "Para mí, la tortilla." },
      { id: "place", label: "Estoy en la tortilla." },
      { id: "name", label: "Me llamo tortilla." },
    ],
    correctOptionId: "order",
    successFeedback: "Good. “Para mí…” is a useful way to choose your dish.",
    retryFeedback: "Use the phrase that starts with “Para mí…”.",
  },
  listening: {
    id: "listen-restaurant-order",
    itemId: "listening:restaurant-order",
    clipId: "restaurant-order",
    targetText: "Para mí, la ensalada y agua, por favor.",
    supportText: "For me, the salad and water, please.",
    prompt: "What does the customer order?",
    context: "Play the audio and listen for the food and drink.",
    options: [
      { id: "salad-water", label: "Salad and water" },
      { id: "tortilla-coffee", label: "Tortilla and coffee" },
      { id: "soup-juice", label: "Soup and juice" },
    ],
    correctOptionId: "salad-water",
    successFeedback: "Correct. You heard “la ensalada y agua”.",
    retryFeedback: "Listen again for the two items after “Para mí”.",
  },
  speaking: {
    id: "speak-restaurant",
    itemId: "construction:spoken-restaurant-order",
    targetText: "Para mí… La cuenta, por favor.",
    supportText: "Order food, then ask for the bill.",
    assessorId: "restaurant",
    prompt: "Order one dish and then ask for the bill.",
    context: "Example: “Para mí, la tortilla. La cuenta, por favor.”",
    successFeedback: "Task complete: you ordered food and asked for the bill.",
    retryFeedback: "Try again with a food order and “La cuenta, por favor”.",
  },
});

export const familyLesson = createCompactLesson({
  sourceReference: "internal:mvp-family-v1",
  recognition: {
    id: "meaning-family-sevilla",
    itemId: "phrase:mi-hermana-vive-sevilla",
    targetText: "Mi hermana vive en Sevilla.",
    supportText: "My sister lives in Seville.",
    prompt: "What does the sentence tell you?",
    context: "Someone is talking about their family.",
    options: [
      { id: "sister-seville", label: "Their sister lives in Seville" },
      { id: "mother-madrid", label: "Their mother lives in Madrid" },
      { id: "brother-works", label: "Their brother works in a hotel" },
    ],
    correctOptionId: "sister-seville",
    successFeedback: "Correct. “Hermana” means sister and “vive” means lives.",
    retryFeedback: "Look at the words “hermana” and “vive”.",
  },
  recall: {
    id: "retrieve-family-name",
    itemId: "construction:mi-padre-se-llama",
    targetText: "Mi padre se llama Carlos.",
    supportText: "My father's name is Carlos.",
    prompt: "Choose the natural phrase to give your father's name.",
    context: "You are describing one member of your family.",
    options: [
      { id: "name", label: "Mi padre se llama Carlos." },
      { id: "origin", label: "Mi padre es de Carlos." },
      { id: "time", label: "Mi padre a las Carlos." },
    ],
    correctOptionId: "name",
    successFeedback: "Good. “Se llama…” gives a person's name.",
    retryFeedback: "Choose the phrase that uses “se llama”.",
  },
  listening: {
    id: "listen-family-ana",
    itemId: "listening:family-ana",
    clipId: "family-ana",
    targetText: "Mi madre se llama Ana y trabaja en un hospital.",
    supportText: "My mother's name is Ana and she works in a hospital.",
    prompt: "Where does Ana work?",
    context: "Play the audio and listen for the workplace.",
    options: [
      { id: "hospital", label: "In a hospital" },
      { id: "school", label: "In a school" },
      { id: "hotel", label: "In a hotel" },
    ],
    correctOptionId: "hospital",
    successFeedback: "Correct. You heard “trabaja en un hospital”.",
    retryFeedback: "Listen again for the words after “trabaja en”.",
  },
  speaking: {
    id: "speak-family",
    itemId: "construction:spoken-family-description",
    targetText: "Mi… se llama… y vive/trabaja…",
    supportText: "Mention a family member and add one detail.",
    assessorId: "family",
    prompt: "Describe one family member in one or two short sentences.",
    context: "Example: “Mi hermana se llama Ana y vive en Valencia.”",
    successFeedback: "Task complete: you mentioned a family member and added a detail.",
    retryFeedback: "Try again with a family member plus a name, city, job, or another simple detail.",
  },
});

export const freeTimeLesson = createCompactLesson({
  sourceReference: "internal:mvp-free-time-v1",
  recognition: {
    id: "meaning-free-time-reading",
    itemId: "phrase:a-veces-leo",
    targetText: "A veces leo por la tarde.",
    supportText: "Sometimes I read in the afternoon.",
    prompt: "What does the person sometimes do?",
    context: "They are talking about free time.",
    options: [
      { id: "read", label: "Read" },
      { id: "run", label: "Run" },
      { id: "cook", label: "Cook" },
    ],
    correctOptionId: "read",
    successFeedback: "Correct. “Leo” means “I read”.",
    retryFeedback: "Focus on the verb “leo”.",
  },
  recall: {
    id: "retrieve-weekend-activity",
    itemId: "construction:fines-semana-camino",
    targetText: "Los fines de semana camino mucho.",
    supportText: "At weekends I walk a lot.",
    prompt: "Choose the natural phrase for a regular weekend activity.",
    context: "You want to say what you often do at weekends.",
    options: [
      { id: "walk", label: "Los fines de semana camino mucho." },
      { id: "ticket", label: "Los fines de semana un billete." },
      { id: "weather", label: "Los fines de semana hace nombre." },
    ],
    correctOptionId: "walk",
    successFeedback: "Good. “Los fines de semana…” is useful for a regular weekend habit.",
    retryFeedback: "Choose the complete sentence about a weekend activity.",
  },
  listening: {
    id: "listen-free-time-diego",
    itemId: "listening:free-time-diego",
    clipId: "free-time-diego",
    targetText: "Los sábados corro por la mañana y a veces cocino por la noche.",
    supportText: "On Saturdays I run in the morning and sometimes cook at night.",
    prompt: "What does the person do in the morning?",
    context: "Play the audio and listen for the morning activity.",
    options: [
      { id: "run", label: "Run" },
      { id: "cook", label: "Cook" },
      { id: "read", label: "Read" },
    ],
    correctOptionId: "run",
    successFeedback: "Correct. You heard “corro por la mañana”.",
    retryFeedback: "Listen again for the activity before “por la mañana”.",
  },
  speaking: {
    id: "speak-free-time",
    itemId: "construction:spoken-free-time",
    targetText: "A veces… / Los fines de semana…",
    supportText: "Say a leisure activity and when or how often you do it.",
    assessorId: "free-time",
    prompt: "Talk about one thing you do in your free time.",
    context: "Example: “A veces leo por la tarde.” or “Los fines de semana corro.”",
    successFeedback: "Task complete: you gave a leisure activity and a time or frequency.",
    retryFeedback: "Try again with an activity plus “a veces”, a day, or a time of day.",
  },
});

export const makingPlansLesson = createCompactLesson({
  sourceReference: "internal:mvp-making-plans-v1",
  recognition: {
    id: "meaning-plan-saturday",
    itemId: "phrase:te-va-bien-sabado",
    targetText: "¿Te va bien el sábado?",
    supportText: "Is Saturday good for you?",
    prompt: "What is the speaker asking?",
    context: "Two people are trying to make a plan.",
    options: [
      { id: "availability", label: "Whether Saturday works" },
      { id: "price", label: "How much Saturday costs" },
      { id: "direction", label: "Where Saturday is" },
    ],
    correctOptionId: "availability",
    successFeedback: "Correct. “¿Te va bien…?” asks whether a time works for someone.",
    retryFeedback: "The phrase asks if Saturday is a good time.",
  },
  recall: {
    id: "retrieve-plan-friday",
    itemId: "construction:puedo-viernes-tarde",
    targetText: "Puedo el viernes por la tarde.",
    supportText: "I can do Friday afternoon.",
    prompt: "Choose the natural phrase to say when you are free.",
    context: "Your friend asks when you can meet.",
    options: [
      { id: "available", label: "Puedo el viernes por la tarde." },
      { id: "weather", label: "Hace viernes por la tarde." },
      { id: "order", label: "Quiero viernes por la tarde." },
    ],
    correctOptionId: "available",
    successFeedback: "Good. “Puedo…” is a simple way to say when you are available.",
    retryFeedback: "Choose the sentence beginning with “Puedo…”.",
  },
  listening: {
    id: "listen-plans-saturday",
    itemId: "listening:plans-saturday",
    clipId: "plans-saturday",
    targetText: "Quedamos el sábado a las seis de la tarde.",
    supportText: "Let's meet on Saturday at six in the afternoon.",
    prompt: "When are they meeting?",
    context: "Play the audio and listen for the day and time.",
    options: [
      { id: "sat-six", label: "Saturday at 6 pm" },
      { id: "fri-six", label: "Friday at 6 pm" },
      { id: "sat-eight", label: "Saturday at 8 pm" },
    ],
    correctOptionId: "sat-six",
    successFeedback: "Correct. You heard “el sábado a las seis de la tarde”.",
    retryFeedback: "Listen again for the day and the number after “a las”.",
  },
  speaking: {
    id: "speak-making-plans",
    itemId: "construction:spoken-making-plans",
    targetText: "Puedo… / Quedamos…",
    supportText: "Say when you are free or suggest a meeting time.",
    assessorId: "making-plans",
    prompt: "Suggest a simple time to meet.",
    context: "Example: “Puedo el sábado. Quedamos a las seis.”",
    successFeedback: "Task complete: you expressed availability and included a day or time.",
    retryFeedback: "Try again with “Puedo…” or “Quedamos…” plus a day or time.",
  },
});

export const weatherLesson = createCompactLesson({
  sourceReference: "internal:mvp-weather-v1",
  recognition: {
    id: "meaning-weather-cold",
    itemId: "phrase:hace-frio",
    targetText: "Hace frío.",
    supportText: "It is cold.",
    prompt: "What is the weather like?",
    context: "Someone looks outside and comments on the weather.",
    options: [
      { id: "cold", label: "Cold" },
      { id: "hot", label: "Hot" },
      { id: "rainy", label: "Rainy" },
    ],
    correctOptionId: "cold",
    successFeedback: "Correct. “Hace frío” means it is cold.",
    retryFeedback: "“Frío” means cold.",
  },
  recall: {
    id: "retrieve-weather-sun",
    itemId: "construction:hoy-hace-sol",
    targetText: "Hoy hace sol.",
    supportText: "Today it is sunny.",
    prompt: "Choose the natural phrase for sunny weather today.",
    context: "You are describing today's weather.",
    options: [
      { id: "sun", label: "Hoy hace sol." },
      { id: "name", label: "Hoy se llama sol." },
      { id: "ticket", label: "Hoy un billete sol." },
    ],
    correctOptionId: "sun",
    successFeedback: "Good. “Hace sol” means it is sunny.",
    retryFeedback: "Choose the sentence with “hace sol”.",
  },
  listening: {
    id: "listen-weather-madrid",
    itemId: "listening:weather-madrid",
    clipId: "weather-madrid",
    targetText: "Hoy en Madrid hace sol, pero hace bastante frío.",
    supportText: "Today in Madrid it is sunny, but quite cold.",
    prompt: "Which description matches the audio?",
    context: "Play the audio and listen for both weather details.",
    options: [
      { id: "sun-cold", label: "Sunny and cold" },
      { id: "rain-hot", label: "Rainy and hot" },
      { id: "cloud-warm", label: "Cloudy and warm" },
    ],
    correctOptionId: "sun-cold",
    successFeedback: "Correct. You heard “hace sol” and “hace bastante frío”.",
    retryFeedback: "Listen again for the two phrases beginning with “hace”.",
  },
  speaking: {
    id: "speak-weather",
    itemId: "construction:spoken-weather",
    targetText: "Hace… Tengo… / Necesito…",
    supportText: "Describe the weather and add a simple personal comment.",
    assessorId: "weather",
    prompt: "Describe the weather and say how it affects you.",
    context: "Example: “Hace frío. Tengo frío.” or “Hace sol. Necesito gafas de sol.”",
    successFeedback: "Task complete: you described the weather and added a personal comment.",
    retryFeedback: "Try again with a weather phrase plus “Tengo…” or “Necesito…”.",
  },
});

const lessonTeachingModules: Record<LessonKey, LessonTeachingModule[]> = {
  "introductions-v1": [{
    id: "first-meeting", beforeExerciseId: "meaning-encantada",
    focus: "A first meeting: give your name and respond politely.",
    phrases: [
      { spanish: "Me llamo…", english: "My name is…" },
      { spanish: "Soy de…", english: "I am from…" },
      { spanish: "Encantada.", english: "Pleased to meet you (said by a woman)." },
    ],
    example: { spanish: "Me llamo Lucía. Soy de Madrid. Encantada.", english: "My name is Lucía. I am from Madrid. Pleased to meet you." },
  }],
  "daily-routines-v1": [{
    id: "morning-actions", beforeExerciseId: "meaning-me-levanto",
    focus: "Say two simple things you do in the morning.",
    phrases: [
      { spanish: "Me levanto a las siete.", english: "I get up at seven." },
      { spanish: "Desayuno.", english: "I have breakfast." },
      { spanish: "Y", english: "And; it joins two actions." },
    ],
    example: { spanish: "Me levanto a las siete y desayuno.", english: "I get up at seven and have breakfast." },
  }],
  "cafe-ordering-v1": [
    {
      id: "polite-order", beforeExerciseId: "meaning-quiero-cafe",
      focus: "Ask for something politely in a café.",
      phrases: [
        { spanish: "Quiero un café.", english: "I would like a coffee." },
        { spanish: "Por favor.", english: "Please." },
        { spanish: "Agua", english: "Water." },
      ],
      example: { spanish: "Quiero un café, por favor.", english: "I would like a coffee, please." },
    },
    {
      id: "with-without", beforeExerciseId: "understand-cafe-without",
      focus: "Say what you want with or without something.",
      phrases: [
        { spanish: "Con leche", english: "With milk." },
        { spanish: "Sin azúcar", english: "Without sugar." },
      ],
      example: { spanish: "Un café con leche, sin azúcar.", english: "A coffee with milk, without sugar." },
    },
  ],
  "shopping-v1": [{
    id: "shop-quantity-price", beforeExerciseId: "meaning-medio-kilo",
    focus: "Ask for a quantity, then ask the price.",
    phrases: [
      { spanish: "Medio kilo de…", english: "Half a kilo of…" },
      { spanish: "¿Cuánto cuesta?", english: "How much does it cost?" },
      { spanish: "Tres euros", english: "Three euros." },
    ],
    example: { spanish: "Medio kilo de tomates, por favor. ¿Cuánto cuesta?", english: "Half a kilo of tomatoes, please. How much does it cost?" },
  }],
  "directions-v1": [{
    id: "ask-and-follow-directions", beforeExerciseId: "meaning-todo-recto",
    focus: "Ask where a place is and understand a simple direction.",
    phrases: [
      { spanish: "¿Dónde está…?", english: "Where is…?" },
      { spanish: "Todo recto.", english: "Straight ahead." },
      { spanish: "A la derecha.", english: "On the right." },
    ],
    example: { spanish: "¿Dónde está la estación? Todo recto y a la derecha.", english: "Where is the station? Straight ahead and to the right." },
  }],
  "transport-v1": [{
    id: "ticket-and-journey", beforeExerciseId: "meaning-ida-vuelta",
    focus: "Choose a journey and ask for a ticket.",
    phrases: [
      { spanish: "Ida y vuelta", english: "There and back; a return journey." },
      { spanish: "Un billete para…", english: "One ticket to…" },
      { spanish: "A las nueve y media", english: "At half past nine (9:30)." },
    ],
    example: { spanish: "Un billete de ida y vuelta para Toledo, por favor.", english: "One return ticket to Toledo, please." },
  }],
  "hotel-checkin-v1": [{
    id: "hotel-booking", beforeExerciseId: "meaning-reserva",
    focus: "Say you have a booking and give the name.",
    phrases: [
      { spanish: "Tengo una reserva.", english: "I have a reservation." },
      { spanish: "A nombre de…", english: "Under the name…" },
      { spanish: "Habitación", english: "Room." },
      { spanish: "Doscientos catorce", english: "Two hundred and fourteen (214)." },
    ],
    example: { spanish: "Tengo una reserva a nombre de García.", english: "I have a reservation under the name García." },
  }],
  "restaurant-v1": [{
    id: "meal-and-bill", beforeExerciseId: "meaning-la-cuenta",
    focus: "Order a dish and ask for the bill.",
    phrases: [
      { spanish: "Para mí…", english: "For me…; use it to choose your dish." },
      { spanish: "La cuenta, por favor.", english: "The bill, please." },
      { spanish: "Ensalada y agua", english: "Salad and water." },
    ],
    example: { spanish: "Para mí, la tortilla. La cuenta, por favor.", english: "For me, the tortilla. The bill, please." },
  }],
  "family-v1": [{
    id: "family-detail", beforeExerciseId: "meaning-family-sevilla",
    focus: "Name a family member and add one detail.",
    phrases: [
      { spanish: "Mi hermana", english: "My sister." },
      { spanish: "Vive en…", english: "Lives in…" },
      { spanish: "Se llama…", english: "Is called…; use it for a person's name." },
      { spanish: "Trabaja en un hospital.", english: "Works in a hospital." },
    ],
    example: { spanish: "Mi hermana se llama Ana y vive en Sevilla.", english: "My sister is called Ana and lives in Seville." },
  }],
  "free-time-v1": [{
    id: "leisure-frequency", beforeExerciseId: "meaning-free-time-reading",
    focus: "Talk about an activity and when you do it.",
    phrases: [
      { spanish: "A veces", english: "Sometimes." },
      { spanish: "Leo", english: "I read." },
      { spanish: "Los fines de semana", english: "At weekends." },
      { spanish: "Corro por la mañana.", english: "I run in the morning." },
    ],
    example: { spanish: "A veces leo por la tarde.", english: "Sometimes I read in the afternoon." },
  }],
  "making-plans-v1": [{
    id: "availability-and-time", beforeExerciseId: "meaning-plan-saturday",
    focus: "Ask if a day works and suggest a time.",
    phrases: [
      { spanish: "¿Te va bien…?", english: "Is … good for you?" },
      { spanish: "Puedo…", english: "I can…" },
      { spanish: "Quedamos…", english: "Let's meet…" },
      { spanish: "A las seis", english: "At six o'clock." },
    ],
    example: { spanish: "¿Te va bien el sábado? Puedo por la tarde.", english: "Is Saturday good for you? I can do the afternoon." },
  }],
  "weather-v1": [{
    id: "weather-and-feeling", beforeExerciseId: "meaning-weather-cold",
    focus: "Describe the weather and add a personal comment.",
    phrases: [
      { spanish: "Hace frío.", english: "It is cold." },
      { spanish: "Hace sol.", english: "It is sunny." },
      { spanish: "Tengo frío.", english: "I feel cold." },
    ],
    example: { spanish: "Hace frío. Tengo frío.", english: "It is cold. I feel cold." },
  }],
};

export const lessonCatalog: Record<LessonKey, LessonDefinition> = {
  "introductions-v1": {
    key: "introductions-v1",
    topic: "introductions",
    title: "Meet someone new",
    objective: "Say your name and where you are from.",
    completionTitle: "You can make a first introduction.",
    completionSummary:
      "You practised Me llamo…, Soy de…, and Encantada, listened for a place name, and completed a spoken introduction.",
    planner: {
      listeningObjective: "Recognise a name and place in natural Spain Spanish.",
      speakingTitle: "Say your introduction",
      speakingObjective: "Give your name and where you are from aloud.",
      progressionReason: "Introductions are the first practical A1 topic in your path.",
    },
    exercises: introductionLesson,
    teachingModules: lessonTeachingModules["introductions-v1"],
  },
  "daily-routines-v1": {
    key: "daily-routines-v1",
    topic: "daily-routines",
    title: "Talk about your morning",
    objective: "Say when you get up and connect two morning actions.",
    completionTitle: "You can describe a simple morning routine.",
    completionSummary:
      "You practised Me levanto…, a las…, and desayuno, listened for a time, and completed a spoken routine.",
    planner: {
      listeningObjective: "Recognise a time in natural Spain Spanish.",
      speakingTitle: "Describe your morning",
      speakingObjective: "Say when you get up and that you have breakfast.",
      progressionReason: "Introductions are complete, so your next topic is daily routines.",
    },
    exercises: dailyRoutineLesson,
    teachingModules: lessonTeachingModules["daily-routines-v1"],
  },
  "cafe-ordering-v1": {
    key: "cafe-ordering-v1",
    topic: "cafe-ordering",
    title: "Order in a cafe",
    objective: "Order a drink and another item politely.",
    completionTitle: "You can make a simple cafe order.",
    completionSummary:
      "You practised Quiero…, café con leche, and por favor, listened for two drinks, and completed a spoken order.",
    planner: {
      listeningObjective: "Recognise drinks in a natural cafe order.",
      speakingTitle: "Make a cafe order",
      speakingObjective: "Order two items and add a polite ending.",
      progressionReason: "Daily routines are complete, so your next topic is ordering in a cafe.",
    },
    exercises: cafeOrderingLesson,
    teachingModules: lessonTeachingModules["cafe-ordering-v1"],
  },
  "shopping-v1": {
    key: "shopping-v1",
    topic: "shopping",
    title: "Buy food in a shop",
    objective: "Ask for a useful quantity and ask the price.",
    completionTitle: "You can make a simple food purchase.",
    completionSummary:
      "You practised quantities, asking the price, listening for euros, and completed a short shopping request.",
    planner: {
      listeningObjective: "Recognise a simple price in natural Spain Spanish.",
      speakingTitle: "Buy food and ask the price",
      speakingObjective: "Ask for a quantity of a product and ask how much it costs.",
      progressionReason: "Cafe ordering is complete, so the path moves to buying food in a shop.",
    },
    exercises: shoppingLesson,
    teachingModules: lessonTeachingModules["shopping-v1"],
  },
  "directions-v1": {
    key: "directions-v1",
    topic: "directions",
    title: "Ask for directions",
    objective: "Ask where a place is and understand a basic direction.",
    completionTitle: "You can ask for a place and follow one simple direction.",
    completionSummary:
      "You practised ¿Dónde está…?, todo recto, a la derecha, and completed a spoken directions question.",
    planner: {
      listeningObjective: "Recognise left or right in a short direction.",
      speakingTitle: "Ask how to find a place",
      speakingObjective: "Ask where a station, pharmacy, museum, hotel, metro, or plaza is.",
      progressionReason: "Shopping is complete, so the path moves to finding places around town.",
    },
    exercises: directionsLesson,
    teachingModules: lessonTeachingModules["directions-v1"],
  },
  "transport-v1": {
    key: "transport-v1",
    topic: "transport",
    title: "Buy a ticket",
    objective: "Ask for a ticket to a destination and recognise a departure time.",
    completionTitle: "You can buy a simple train or bus ticket.",
    completionSummary:
      "You practised billete para…, ida y vuelta, a departure time, and completed a spoken ticket request.",
    planner: {
      listeningObjective: "Recognise a departure time in a short travel announcement.",
      speakingTitle: "Buy a ticket to a city",
      speakingObjective: "Request a ticket and give the destination.",
      progressionReason: "Directions are complete, so the path moves to practical public transport.",
    },
    exercises: transportLesson,
    teachingModules: lessonTeachingModules["transport-v1"],
  },
  "hotel-checkin-v1": {
    key: "hotel-checkin-v1",
    topic: "hotel-checkin",
    title: "Check in at a hotel",
    objective: "Say that you have a reservation and give the booking name.",
    completionTitle: "You can start a simple hotel check-in.",
    completionSummary:
      "You practised Tengo una reserva, a nombre de…, listened for a room number, and completed a spoken check-in.",
    planner: {
      listeningObjective: "Recognise a room number in a short hotel exchange.",
      speakingTitle: "Check in with a reservation",
      speakingObjective: "Say that you have a reservation and give the booking name.",
      progressionReason: "Transport is complete, so the path moves to checking in at accommodation.",
    },
    exercises: hotelCheckinLesson,
    teachingModules: lessonTeachingModules["hotel-checkin-v1"],
  },
  "restaurant-v1": {
    key: "restaurant-v1",
    topic: "restaurant",
    title: "Eat in a restaurant",
    objective: "Order a dish and ask for the bill.",
    completionTitle: "You can manage a simple restaurant order.",
    completionSummary:
      "You practised Para mí…, La cuenta, por favor, listened for food and drink, and completed a spoken restaurant task.",
    planner: {
      listeningObjective: "Recognise a simple food and drink order in natural Spain Spanish.",
      speakingTitle: "Order food and ask for the bill",
      speakingObjective: "Order one dish and ask for the bill politely.",
      progressionReason: "Hotel check-in is complete, so the path moves to eating in a restaurant.",
    },
    exercises: restaurantLesson,
    teachingModules: lessonTeachingModules["restaurant-v1"],
  },
  "family-v1": {
    key: "family-v1",
    topic: "family",
    title: "Talk about your family",
    objective: "Mention a family member and give one simple detail.",
    completionTitle: "You can describe one family member.",
    completionSummary:
      "You practised family words, se llama…, listened for a workplace, and completed a short family description.",
    planner: {
      listeningObjective: "Recognise a family member and one personal detail.",
      speakingTitle: "Describe a family member",
      speakingObjective: "Mention a family member and add a name, place, job, or other simple detail.",
      progressionReason: "Restaurant language is complete, so the path moves to talking about people close to you.",
    },
    exercises: familyLesson,
    teachingModules: lessonTeachingModules["family-v1"],
  },
  "free-time-v1": {
    key: "free-time-v1",
    topic: "free-time",
    title: "Talk about free time",
    objective: "Describe one leisure activity and say when or how often you do it.",
    completionTitle: "You can describe a simple free-time habit.",
    completionSummary:
      "You practised leisure activities, frequency and time phrases, listened for an activity, and completed a spoken free-time description.",
    planner: {
      listeningObjective: "Recognise a leisure activity and when it happens.",
      speakingTitle: "Describe your free time",
      speakingObjective: "Say one leisure activity and add a time or frequency phrase.",
      progressionReason: "Family language is complete, so the path moves to everyday interests and hobbies.",
    },
    exercises: freeTimeLesson,
    teachingModules: lessonTeachingModules["free-time-v1"],
  },
  "making-plans-v1": {
    key: "making-plans-v1",
    topic: "making-plans",
    title: "Make a simple plan",
    objective: "Say when you are free and suggest a meeting time.",
    completionTitle: "You can arrange a simple meeting time.",
    completionSummary:
      "You practised ¿Te va bien…?, Puedo…, listened for a day and time, and completed a spoken planning task.",
    planner: {
      listeningObjective: "Recognise a day and meeting time in a short exchange.",
      speakingTitle: "Suggest a time to meet",
      speakingObjective: "Express availability and give a day or time.",
      progressionReason: "Free-time language is complete, so the path moves to making plans with other people.",
    },
    exercises: makingPlansLesson,
    teachingModules: lessonTeachingModules["making-plans-v1"],
  },
  "weather-v1": {
    key: "weather-v1",
    topic: "weather",
    title: "Talk about the weather",
    objective: "Describe the weather and add a simple personal comment.",
    completionTitle: "You can make a simple weather comment.",
    completionSummary:
      "You practised hace frío, hace sol, listened for two weather details, and completed a spoken weather description.",
    planner: {
      listeningObjective: "Recognise two basic weather conditions in natural Spain Spanish.",
      speakingTitle: "Describe today's weather",
      speakingObjective: "Describe a weather condition and say how it affects you.",
      progressionReason: "Making plans is complete, so the path adds weather language for everyday small talk.",
    },
    exercises: weatherLesson,
    teachingModules: lessonTeachingModules["weather-v1"],
  },
};

export function lessonTeachingSequenceIssues(lesson: LessonDefinition): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const positions = new Map(lesson.exercises.map((exercise, index) => [exercise.id, index]));
  let lastPosition = -1;

  if (lesson.teachingModules.length === 0) issues.push("A new lesson needs a teaching module.");
  for (const teaching of lesson.teachingModules) {
    const position = positions.get(teaching.beforeExerciseId);
    if (ids.has(teaching.id)) issues.push(`Duplicate teaching module: ${teaching.id}.`);
    ids.add(teaching.id);
    if (position === undefined) {
      issues.push(`Teaching module ${teaching.id} has no matching exercise.`);
      continue;
    }
    if (position < lastPosition) issues.push(`Teaching module ${teaching.id} is out of order.`);
    lastPosition = position;
    const check = lesson.exercises[position];
    if (check.modality !== "recognition" || check.options.length < 2
      || !check.options.some(({ id }) => id === check.correctOptionId)) {
      issues.push(`Teaching module ${teaching.id} needs a valid comprehension check.`);
    }
    if (!teaching.focus.trim() || teaching.phrases.length === 0
      || teaching.phrases.some(({ spanish, english }) => !spanish.trim() || !english.trim())
      || !teaching.example.spanish.trim() || !teaching.example.english.trim()) {
      issues.push(`Teaching module ${teaching.id} needs meaning and a contextual example.`);
    }
  }

  const firstPosition = positions.get(lesson.teachingModules[0]?.beforeExerciseId ?? "");
  if (firstPosition !== 0) issues.push("Introduce useful language before the first exercise.");
  for (const [index, exercise] of lesson.exercises.entries()) {
    if (exercise.modality === "recognition") continue;
    if (!lesson.teachingModules.some((module) => (positions.get(module.beforeExerciseId) ?? Infinity) < index)) {
      issues.push(`${exercise.id} needs an earlier introduction and comprehension check.`);
    }
    if (exercise.modality === "production"
      && !lesson.exercises.slice(0, index).some(({ modality }) => modality === "listening")) {
      issues.push(`${exercise.id} needs listening practice before speaking.`);
    }
  }
  return issues;
}

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
  const lesson = Object.values(lessonCatalog).find(({ exercises }) =>
    exercises.some(({ id }) => id === exercise.id));
  const completesLesson = Boolean(
    lesson
      && isCorrect
      && !wasCompleted
      && progress.completedExerciseIds.length + 1 === lesson.exercises.length,
  );

  return {
    ...progress,
    attempts: progress.attempts + 1,
    correctAnswers: progress.correctAnswers + (isCorrect && !wasCompleted ? 1 : 0),
    completedExerciseIds:
      isCorrect && !wasCompleted
        ? [...progress.completedExerciseIds, exercise.id]
        : progress.completedExerciseIds,
    completedAt: completesLesson ? new Date().toISOString() : progress.completedAt,
  };
}
