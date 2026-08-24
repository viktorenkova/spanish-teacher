import { describe, expect, it } from "vitest";
import {
  createEmptyProgress,
  introductionLesson,
  recordAnswer,
} from "./lesson";

describe("lesson progress", () => {
  it("records attempts without completing an incorrect answer", () => {
    const progress = recordAnswer(createEmptyProgress(), introductionLesson[0], "sorry");

    expect(progress.attempts).toBe(1);
    expect(progress.correctAnswers).toBe(0);
    expect(progress.completedExerciseIds).toEqual([]);
  });

  it("awards an exercise only once", () => {
    const exercise = introductionLesson[0];
    const first = recordAnswer(createEmptyProgress(), exercise, exercise.correctOptionId);
    const repeated = recordAnswer(first, exercise, exercise.correctOptionId);

    expect(repeated.attempts).toBe(2);
    expect(repeated.correctAnswers).toBe(1);
    expect(repeated.completedExerciseIds).toEqual([exercise.id]);
  });
});

