import { describe, expect, it } from "vitest";
import { dailyRoutineLesson, introductionLesson } from "./lesson";
import { buildLearnerOverview } from "./learner-overview";

const progress = {
  introducedItemCount: 10,
  reviewedTodayCount: 4,
  dueReviewCount: 3,
  hasCompletedSpeakingTask: true,
};

const learner = {
  displayName: "Kate",
  overallLevel: "A1",
  a1Band: "mid" as const,
  primaryGoal: "conversation" as const,
  preferredSessionMinutes: 10 as const,
};

describe("learner overview", () => {
  it("shows the first topic before learning evidence exists", () => {
    const overview = buildLearnerOverview({
      learner,
      progress: { ...progress, introducedItemCount: 0, dueReviewCount: 0 },
      completedLessonCount: 0,
      completedExerciseIds: {},
    });

    expect(overview.completedTopicCount).toBe(0);
    expect(overview.curriculumComplete).toBe(false);
    expect(overview.nextLesson.key).toBe("introductions-v1");
    expect(overview.curriculum[0]).toMatchObject({
      key: "introductions-v1",
      status: "current",
    });
    expect(overview.curriculum[1]).toMatchObject({
      key: "daily-routines-v1",
      status: "upcoming",
    });
    expect(overview.learner).toEqual(learner);
  });

  it("shows cafe ordering after introductions and routines are complete", () => {
    const overview = buildLearnerOverview({
      learner,
      progress,
      completedLessonCount: 2,
      completedExerciseIds: {
        "introductions-v1": introductionLesson.map(({ id }) => id),
        "daily-routines-v1": dailyRoutineLesson.map(({ id }) => id),
      },
    });

    expect(overview.completedLessonCount).toBe(2);
    expect(overview.completedTopicCount).toBe(2);
    expect(overview.nextLesson).toMatchObject({
      key: "cafe-ordering-v1",
      title: "Order in a cafe",
    });
    expect(overview.curriculum.slice(0, 3).map(({ status }) => status)).toEqual([
      "complete",
      "complete",
      "current",
    ]);
  });
});
