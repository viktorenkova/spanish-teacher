import { getLessonDefinition, lessonCatalog, lessonKeys, type LessonKey } from "./lesson";
import { chooseCurriculumLesson, type SessionDuration } from "./lesson-planner";
import type { LearnerPrimaryGoal } from "./learner-profile";
import type { LearnerProgressSummary } from "./progress";

export type LearnerOverview = LearnerProgressSummary & {
  learner: {
    displayName: string;
    overallLevel: string;
    a1Band: "early" | "mid" | "strong";
    primaryGoal: LearnerPrimaryGoal;
    preferredSessionMinutes: SessionDuration;
  };
  completedLessonCount: number;
  completedTopicCount: number;
  totalTopicCount: number;
  curriculumComplete: boolean;
  nextLesson: {
    key: LessonKey;
    title: string;
    objective: string;
  };
  curriculum: Array<{
    key: LessonKey;
    title: string;
    objective: string;
    status: "complete" | "current" | "upcoming";
  }>;
  phrasebook: Array<{
    id: string;
    targetText: string;
    supportText: string;
    dueAt?: string;
    lastSelfCheck?: "remembered" | "help";
  }>;
  practiceQueue: LearnerOverview["phrasebook"];
};

type CurriculumEvidence = Partial<Record<LessonKey, string[]>>;

function lessonIsComplete(lessonKey: LessonKey, evidence: CurriculumEvidence) {
  const completed = new Set(evidence[lessonKey] ?? []);
  return lessonCatalog[lessonKey].exercises.every(({ id }) => completed.has(id));
}

export function buildLearnerOverview(input: {
  learner: LearnerOverview["learner"];
  progress: LearnerProgressSummary;
  completedLessonCount: number;
  completedExerciseIds: CurriculumEvidence;
  phrasebook?: LearnerOverview["phrasebook"];
  now?: Date;
}): LearnerOverview {
  const nextLessonKey = chooseCurriculumLesson(input.completedExerciseIds);
  const nextLesson = getLessonDefinition(nextLessonKey);
  if (!nextLesson) throw new Error("Unknown next curriculum lesson");

  const completedTopicCount = lessonKeys.filter((key) => (
    lessonIsComplete(key, input.completedExerciseIds)
  )).length;
  const curriculumComplete = completedTopicCount === lessonKeys.length;
  const now = input.now ?? new Date();
  const phrasebook = input.phrasebook ?? [];
  const practiceQueue = phrasebook.filter((item) =>
    item.lastSelfCheck !== "remembered"
    || !item.dueAt
    || new Date(item.dueAt).getTime() <= now.getTime(),
  );

  return {
    learner: input.learner,
    ...input.progress,
    completedLessonCount: input.completedLessonCount,
    completedTopicCount,
    totalTopicCount: lessonKeys.length,
    curriculumComplete,
    nextLesson: {
      key: nextLesson.key,
      title: nextLesson.title,
      objective: nextLesson.objective,
    },
    curriculum: lessonKeys.map((key) => ({
      key,
      title: lessonCatalog[key].title,
      objective: lessonCatalog[key].objective,
      status: lessonIsComplete(key, input.completedExerciseIds)
        ? "complete"
        : !curriculumComplete && key === nextLessonKey
          ? "current"
          : "upcoming",
    })),
    phrasebook,
    practiceQueue,
  };
}
