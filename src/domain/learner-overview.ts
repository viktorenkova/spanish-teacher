import { getLessonDefinition, lessonCatalog, type LessonKey } from "./lesson";
import { chooseCurriculumLesson } from "./lesson-planner";
import type { LearnerProgressSummary } from "./progress";

export type LearnerOverview = LearnerProgressSummary & {
  learner: {
    displayName: string;
    overallLevel: string;
    a1Band: "early" | "mid" | "strong";
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
}): LearnerOverview {
  const nextLessonKey = chooseCurriculumLesson({
    completedIntroductionExerciseIds: input.completedExerciseIds["introductions-v1"] ?? [],
    completedDailyRoutineExerciseIds: input.completedExerciseIds["daily-routines-v1"] ?? [],
  });
  const nextLesson = getLessonDefinition(nextLessonKey);
  if (!nextLesson) throw new Error("Unknown next curriculum lesson");

  const lessonKeys = Object.keys(lessonCatalog) as LessonKey[];
  const completedTopicCount = lessonKeys.filter((key) => (
    lessonIsComplete(key, input.completedExerciseIds)
  )).length;

  return {
    learner: input.learner,
    ...input.progress,
    completedLessonCount: input.completedLessonCount,
    completedTopicCount,
    totalTopicCount: lessonKeys.length,
    curriculumComplete: completedTopicCount === lessonKeys.length,
    nextLesson: {
      key: nextLesson.key,
      title: nextLesson.title,
      objective: nextLesson.objective,
    },
  };
}
