import { getLessonDefinition, type LessonKey } from "./lesson";

export const supportedSessionDurations = [5, 10, 15, 20, 30] as const;
export type SessionDuration = (typeof supportedSessionDurations)[number];

export type LessonBlockKind =
  | "warmup"
  | "review"
  | "context"
  | "listening"
  | "speaking"
  | "grammar"
  | "recap";

export type LessonPlanBlock = {
  id: string;
  kind: LessonBlockKind;
  title: string;
  objective: string;
  estimatedSeconds: number;
  source: "due_review" | "new_content" | "learner_weakness" | "lesson_scaffold";
  availability: "ready" | "provider_pending";
};

export type LessonPlan = {
  plannerVersion: "duration-aware-v1" | "adaptive-duration-v2";
  lessonKey: LessonKey;
  targetMinutes: SessionDuration;
  estimatedMinutes: number;
  rationale: string[];
  blocks: LessonPlanBlock[];
};

export type LessonPlannerInput = {
  targetMinutes: SessionDuration;
  dueReviewCount: number;
  weakestSkills: string[];
  lessonKey?: LessonKey;
};

export function chooseCurriculumLesson(input: {
  completedIntroductionExerciseIds: string[];
}): LessonKey {
  const introduction = getLessonDefinition("introductions-v1");
  const completed = new Set(input.completedIntroductionExerciseIds);
  return introduction && introduction.exercises.every((exercise) => completed.has(exercise.id))
    ? "daily-routines-v1"
    : "introductions-v1";
}

function createCoreBlocks(lessonKey: LessonKey): LessonPlanBlock[] {
  const lesson = getLessonDefinition(lessonKey);
  if (!lesson) throw new Error("Unknown lesson");
  return [
  {
    id: "warmup",
    kind: "warmup",
    title: "Quick Spanish warm-up",
    objective: "Reactivate familiar A1 language without pressure.",
    estimatedSeconds: 30,
    source: "lesson_scaffold",
    availability: "ready",
  },
  {
    id: "introduction-context",
    kind: "context",
    title: lesson.title,
    objective: lesson.objective,
    estimatedSeconds: 90,
    source: "new_content",
    availability: "ready",
  },
  {
    id: "listening-core",
    kind: "listening",
    title: "Listen for key details",
    objective: lessonKey === "daily-routines-v1"
      ? "Recognise a time in natural Spain Spanish."
      : "Recognise a name and place in natural Spain Spanish.",
    estimatedSeconds: 60,
    source: "lesson_scaffold",
    availability: "ready",
  },
  {
    id: "speaking-core",
    kind: "speaking",
    title: lessonKey === "daily-routines-v1" ? "Describe your morning" : "Say your introduction",
    objective: lessonKey === "daily-routines-v1"
      ? "Say when you get up and that you have breakfast."
      : "Give your name and where you are from aloud.",
    estimatedSeconds: 90,
    source: "lesson_scaffold",
    availability: "ready",
  },
  {
    id: "recap",
    kind: "recap",
    title: "Finish with retrieval",
    objective: "Recall the most useful phrase once more.",
    estimatedSeconds: 30,
    source: "lesson_scaffold",
    availability: "ready",
  },
  ];
}

const expansionBlocks: Omit<LessonPlanBlock, "id">[] = [
  {
    kind: "review",
    title: "Due phrase review",
    objective: "Retrieve language scheduled by FSRS.",
    estimatedSeconds: 90,
    source: "due_review",
    availability: "ready",
  },
  {
    kind: "grammar",
    title: "Small grammar contrast",
    objective: "Practise one weak pattern inside a useful sentence.",
    estimatedSeconds: 120,
    source: "learner_weakness",
    availability: "ready",
  },
  {
    kind: "context",
    title: "Daily routine in context",
    objective: "Connect a new A1 phrase to everyday life.",
    estimatedSeconds: 120,
    source: "new_content",
    availability: "ready",
  },
  {
    kind: "listening",
    title: "Listen with less support",
    objective: "Understand a second short exchange without seeing English first.",
    estimatedSeconds: 120,
    source: "lesson_scaffold",
    availability: "provider_pending",
  },
  {
    kind: "speaking",
    title: "Guided conversation turn",
    objective: "Use the target phrases in a short response.",
    estimatedSeconds: 180,
    source: "lesson_scaffold",
    availability: "provider_pending",
  },
];

export function buildLessonPlan(input: LessonPlannerInput): LessonPlan {
  const lessonKey = input.lessonKey ?? "introductions-v1";
  const targetSeconds = input.targetMinutes * 60;
  const blocks = createCoreBlocks(lessonKey).map((block) => ({ ...block }));
  let totalSeconds = blocks.reduce((total, block) => total + block.estimatedSeconds, 0);
  let expansionIndex = 0;

  while (totalSeconds < targetSeconds - 45) {
    const template = expansionBlocks[expansionIndex % expansionBlocks.length];
    const remaining = targetSeconds - totalSeconds;
    const estimatedSeconds = Math.min(template.estimatedSeconds, remaining);
    if (estimatedSeconds < 45) break;
    blocks.splice(-1, 0, {
      ...template,
      id: `${template.kind}-${expansionIndex + 1}`,
      estimatedSeconds,
    });
    totalSeconds += estimatedSeconds;
    expansionIndex += 1;
  }

  const reviewBlocks = blocks.filter((block) => block.kind === "review");
  reviewBlocks.forEach((block, index) => {
    if (index >= input.dueReviewCount) {
      block.source = "new_content";
      block.title = "Useful phrase retrieval";
      block.objective = "Retrieve a recently introduced A1 phrase.";
    }
  });

  const rationale = [
    `${input.targetMinutes}-minute session requested.`,
    lessonKey === "daily-routines-v1"
      ? "Introductions are complete, so the curriculum advances to daily routines."
      : "Introductions are the first practical A1 objective.",
    input.dueReviewCount > 0
      ? `${input.dueReviewCount} FSRS item${input.dueReviewCount === 1 ? " is" : "s are"} due.`
      : "No FSRS reviews are due, so the review space introduces useful A1 language.",
    input.weakestSkills.length > 0
      ? `Current lower-confidence area: ${input.weakestSkills.join(", ")}.`
      : "The learner profile is still collecting skill evidence.",
    "The core speaking task uses transcript evidence; pronunciation is not scored.",
  ];

  return {
    plannerVersion: "adaptive-duration-v2",
    lessonKey,
    targetMinutes: input.targetMinutes,
    estimatedMinutes: Math.round(totalSeconds / 60),
    rationale,
    blocks,
  };
}
