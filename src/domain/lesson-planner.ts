import {
  createReviewExercise,
  getLessonDefinition,
  type LessonExercise,
  type LessonKey,
  type ReviewCandidate,
} from "./lesson";
import {
  learnerPrimaryGoalPlanFocus,
  type LearnerPrimaryGoal,
} from "./learner-profile";

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
  plannerVersion: "duration-aware-v1" | "adaptive-duration-v2" | "adaptive-review-v3" | "goal-aware-v4" | "explainable-v5";
  lessonKey: LessonKey;
  primaryGoal?: LearnerPrimaryGoal;
  goalFocus: string;
  adaptationReasons: string[];
  targetMinutes: SessionDuration;
  estimatedMinutes: number;
  rationale: string[];
  blocks: LessonPlanBlock[];
  reviewExercises: LessonExercise[];
};

export type LessonPlannerInput = {
  primaryGoal?: LearnerPrimaryGoal;
  targetMinutes: SessionDuration;
  dueReviewCount: number;
  weakestSkills: string[];
  lessonKey?: LessonKey;
  reviewCandidates?: ReviewCandidate[];
  activeMistakeCount?: number;
  reviewExerciseKey?: string;
};

export function chooseCurriculumLesson(input: {
  completedIntroductionExerciseIds: string[];
  completedDailyRoutineExerciseIds: string[];
}): LessonKey {
  const introduction = getLessonDefinition("introductions-v1");
  const completedIntroductions = new Set(input.completedIntroductionExerciseIds);
  if (!introduction?.exercises.every((exercise) => completedIntroductions.has(exercise.id))) {
    return "introductions-v1";
  }

  const routines = getLessonDefinition("daily-routines-v1");
  const completedRoutines = new Set(input.completedDailyRoutineExerciseIds);
  return routines?.exercises.every((exercise) => completedRoutines.has(exercise.id))
    ? "cafe-ordering-v1"
    : "daily-routines-v1";
}

function createCoreBlocks(
  lessonKey: LessonKey,
  primaryGoal: LearnerPrimaryGoal,
): LessonPlanBlock[] {
  const lesson = getLessonDefinition(lessonKey);
  if (!lesson) throw new Error("Unknown lesson");
  const contextLens: Record<LearnerPrimaryGoal, string> = {
    conversation: "Practise it as a natural two-person exchange.",
    travel: "Connect it to a situation you could meet while travelling.",
    "daily-life": "Keep it small enough to repeat in everyday practice.",
  };
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
    objective: `${lesson.objective} ${contextLens[primaryGoal]}`,
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
      : lessonKey === "cafe-ordering-v1"
        ? "Recognise drinks in a natural cafe order."
        : "Recognise a name and place in natural Spain Spanish.",
    estimatedSeconds: 60,
    source: "lesson_scaffold",
    availability: "ready",
  },
  {
    id: "speaking-core",
    kind: "speaking",
    title: lessonKey === "daily-routines-v1"
      ? "Describe your morning"
      : lessonKey === "cafe-ordering-v1"
        ? "Make a cafe order"
        : "Say your introduction",
    objective: lessonKey === "daily-routines-v1"
      ? "Say when you get up and that you have breakfast."
      : lessonKey === "cafe-ordering-v1"
        ? "Order two items and add a polite ending."
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
  const primaryGoal = input.primaryGoal ?? "conversation";
  const goalFocus = learnerPrimaryGoalPlanFocus[primaryGoal];
  const targetSeconds = input.targetMinutes * 60;
  const blocks = createCoreBlocks(lessonKey, primaryGoal).map((block) => ({ ...block }));
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

  const reviewCandidates = input.reviewCandidates ?? [];
  const availableReviewCount = reviewCandidates.length > 0
    ? reviewCandidates.length
    : input.dueReviewCount;
  const reviewBlocks = blocks.filter((block) => block.kind === "review");
  reviewBlocks.forEach((block, index) => {
    const candidate = reviewCandidates[index];
    if (candidate?.reason === "learner_weakness") {
      block.source = "learner_weakness";
      block.title = "Recurring pattern review";
      block.objective = "Retrieve a phrase connected to an active mistake memory.";
    } else if (index >= availableReviewCount) {
      block.source = "new_content";
      block.title = "Useful phrase retrieval";
      block.objective = "Retrieve a recently introduced A1 phrase.";
    }
  });

  const focusSkill = input.weakestSkills[0];
  if (focusSkill) {
    const recapBlock = blocks.find((block) => block.kind === "recap");
    if (recapBlock) {
      recapBlock.objective = `${recapBlock.objective} Give extra attention to ${focusSkill}.`;
    }
  }

  const scheduledReviewCandidates = reviewCandidates.slice(0, reviewBlocks.length);
  const recurringPatternReviewCount = scheduledReviewCandidates.filter(
    ({ reason }) => reason === "learner_weakness",
  ).length;
  const curriculumReason = lessonKey === "daily-routines-v1"
    ? "Introductions are complete, so your next topic is daily routines."
    : lessonKey === "cafe-ordering-v1"
      ? "Daily routines are complete, so your next topic is ordering in a cafe."
      : "Introductions are the first practical A1 topic in your path.";
  const reviewReason = scheduledReviewCandidates.length > 0
    ? recurringPatternReviewCount > 0
      ? `${scheduledReviewCandidates.length} review${scheduledReviewCandidates.length === 1 ? " is" : "s are"} included, with ${recurringPatternReviewCount} focused on a recurring mistake.`
      : `${scheduledReviewCandidates.length} due review${scheduledReviewCandidates.length === 1 ? " is" : "s are"} included before new practice.`
    : input.dueReviewCount > 0 || (input.activeMistakeCount ?? 0) > 0
      ? "This short plan keeps listening and speaking first; pending reviews stay ready for a longer lesson."
      : "No review is due now, so this plan can focus on useful new A1 language.";
  const adaptationReasons = [
    goalFocus,
    curriculumReason,
    reviewReason,
    ...(focusSkill ? [`Recent evidence suggests giving extra attention to ${focusSkill}.`] : []),
  ];

  const rationale = [
    `${input.targetMinutes}-minute session requested.`,
    `Learner goal: ${goalFocus}`,
    lessonKey === "daily-routines-v1"
      ? "Introductions are complete, so the curriculum advances to daily routines."
      : lessonKey === "cafe-ordering-v1"
        ? "Daily routines are complete, so the curriculum advances to ordering in a cafe."
        : "Introductions are the first practical A1 objective.",
    input.dueReviewCount > 0
      ? `${input.dueReviewCount} FSRS item${input.dueReviewCount === 1 ? " is" : "s are"} due.`
      : "No FSRS reviews are due, so the review space introduces useful A1 language.",
    (input.activeMistakeCount ?? 0) > 0
      ? `${input.activeMistakeCount} active mistake pattern${input.activeMistakeCount === 1 ? " is" : "s are"} available for focused review.`
      : "No recurring mistake pattern needs focused review.",
    input.weakestSkills.length > 0
      ? `Current lower-confidence area: ${input.weakestSkills.join(", ")}.`
      : "The learner profile is still collecting skill evidence.",
    "The core speaking task uses transcript evidence; pronunciation is not scored.",
  ];

  return {
    plannerVersion: "explainable-v5",
    lessonKey,
    primaryGoal,
    goalFocus,
    adaptationReasons,
    targetMinutes: input.targetMinutes,
    estimatedMinutes: Math.round(totalSeconds / 60),
    rationale,
    blocks,
    reviewExercises: scheduledReviewCandidates
      .map((candidate, index) => createReviewExercise(
        candidate,
        index,
        input.reviewExerciseKey,
      )),
  };
}
