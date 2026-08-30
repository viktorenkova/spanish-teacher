import { describe, expect, it } from "vitest";
import {
  buildLessonPlan,
  chooseCurriculumLesson,
  supportedSessionDurations,
} from "./lesson-planner";
import { dailyRoutineLesson, introductionLesson } from "./lesson";

describe("duration-aware lesson planner", () => {
  it.each(supportedSessionDurations)("builds a coherent %i-minute plan", (targetMinutes) => {
    const plan = buildLessonPlan({ targetMinutes, dueReviewCount: 2, weakestSkills: ["grammar"] });

    expect(Math.abs(plan.estimatedMinutes - targetMinutes)).toBeLessThanOrEqual(1);
    expect(plan.blocks.some((block) => block.kind === "speaking")).toBe(true);
    expect(plan.blocks.some((block) => block.kind === "listening")).toBe(true);
    expect(plan.blocks.find((block) => block.id === "speaking-core")?.availability).toBe("ready");
    expect(plan.blocks.find((block) => block.id === "listening-core")?.availability).toBe("ready");
    expect(plan.blocks.at(-1)?.kind).toBe("recap");
  });

  it("uses FSRS due state in its rationale and review source", () => {
    const plan = buildLessonPlan({ targetMinutes: 15, dueReviewCount: 3, weakestSkills: [] });

    expect(plan.rationale.join(" ")).toContain("3 FSRS items");
    expect(plan.blocks.some((block) => block.source === "due_review")).toBe(true);
  });

  it("advances to daily routines only after every introduction exercise is complete", () => {
    expect(chooseCurriculumLesson({
      completedIntroductionExerciseIds: [introductionLesson[0].id],
      completedDailyRoutineExerciseIds: [],
    }))
      .toBe("introductions-v1");
    expect(chooseCurriculumLesson({
      completedIntroductionExerciseIds: introductionLesson.map(({ id }) => id),
      completedDailyRoutineExerciseIds: [],
    })).toBe("daily-routines-v1");
  });

  it("advances from daily routines to cafe ordering", () => {
    expect(chooseCurriculumLesson({
      completedIntroductionExerciseIds: introductionLesson.map(({ id }) => id),
      completedDailyRoutineExerciseIds: dailyRoutineLesson.map(({ id }) => id),
    })).toBe("cafe-ordering-v1");
  });

  it("builds the selected curriculum objective into the plan", () => {
    const plan = buildLessonPlan({
      targetMinutes: 10,
      dueReviewCount: 0,
      weakestSkills: ["speaking"],
      lessonKey: "daily-routines-v1",
    });

    expect(plan.lessonKey).toBe("daily-routines-v1");
    expect(plan.blocks.find(({ id }) => id === "introduction-context")?.title)
      .toBe("Talk about your morning");
  });

  it("aligns the plan explanation and context with the learner goal", () => {
    const plan = buildLessonPlan({
      targetMinutes: 10,
      dueReviewCount: 0,
      weakestSkills: [],
      primaryGoal: "travel",
    });

    expect(plan.plannerVersion).toBe("explainable-v5");
    expect(plan.primaryGoal).toBe("travel");
    expect(plan.goalFocus).toContain("travel interactions");
    expect(plan.rationale.join(" ")).toContain("Learner goal:");
    expect(plan.blocks.find(({ id }) => id === "introduction-context")?.objective)
      .toContain("while travelling");
    expect(plan.adaptationReasons).toEqual(expect.arrayContaining([
      expect.stringContaining("travel interactions"),
      expect.stringContaining("first practical A1 topic"),
    ]));
  });

  it("turns a scheduled review block into an executable exercise", () => {
    const plan = buildLessonPlan({
      targetMinutes: 10,
      dueReviewCount: 1,
      weakestSkills: [],
      reviewExerciseKey: "test-plan",
      reviewCandidates: [{
        learningItem: introductionLesson[0].learningItem,
        reason: "learner_weakness",
      }],
    });

    expect(plan.reviewExercises).toHaveLength(1);
    expect(plan.reviewExercises[0].id).toContain("test-plan");
    expect(plan.reviewExercises[0].modality).toBe("recall");
    expect(plan.blocks.find(({ kind }) => kind === "review")?.source).toBe("learner_weakness");
    expect(plan.adaptationReasons.join(" ")).toContain("recurring mistake");
  });

  it("explains when a short plan leaves due reviews for a longer lesson", () => {
    const plan = buildLessonPlan({
      targetMinutes: 5,
      dueReviewCount: 2,
      weakestSkills: ["grammar"],
    });

    expect(plan.reviewExercises).toHaveLength(0);
    expect(plan.adaptationReasons.join(" ")).toContain("pending reviews stay ready");
    expect(plan.adaptationReasons.join(" ")).toContain("extra attention to grammar");
    expect(plan.blocks.at(-1)?.objective).toContain("grammar");
  });
});
