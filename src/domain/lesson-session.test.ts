import { describe, expect, it } from "vitest";
import { deriveLessonSessionStatus } from "./lesson-session";

describe("lesson session lifecycle", () => {
  it("stays active while any planned exercise is incomplete", () => {
    expect(deriveLessonSessionStatus({
      expectedExerciseIds: ["review", "core"],
      completedExerciseIds: ["review"],
    })).toBe("active");
  });

  it("completes only when every planned exercise has successful evidence", () => {
    expect(deriveLessonSessionStatus({
      expectedExerciseIds: ["review", "core"],
      completedExerciseIds: ["core", "review"],
    })).toBe("completed");
  });

  it("does not derive an abandonment from exercise evidence", () => {
    expect(deriveLessonSessionStatus({
      expectedExerciseIds: ["review", "core"],
      completedExerciseIds: [],
    })).toBe("active");
  });
});
