import { describe, expect, it } from "vitest";
import { buildLessonHistory, type LessonHistoryEvidence } from "./lesson-history";

function lesson(
  overrides: Partial<LessonHistoryEvidence> & Pick<LessonHistoryEvidence, "id" | "completedAt">,
): LessonHistoryEvidence {
  return {
    lessonKey: "introductions-v1",
    startedAt: new Date(overrides.completedAt.getTime() - 10 * 60_000),
    attempts: [],
    ...overrides,
  };
}

describe("lesson history", () => {
  it("summarises results and compares accuracy with the previous lesson", () => {
    const history = buildLessonHistory([
      lesson({
        id: "first",
        completedAt: new Date("2026-08-28T10:10:00.000Z"),
        attempts: [
          { correct: true, modality: "recognition" },
          { correct: false, modality: "recall" },
        ],
      }),
      lesson({
        id: "second",
        completedAt: new Date("2026-08-29T10:10:00.000Z"),
        attempts: [
          { correct: true, modality: "recognition" },
          { correct: true, modality: "production" },
        ],
      }),
    ]);

    expect(history[0]).toMatchObject({
      sessionId: "second",
      accuracyPercent: 100,
      accuracyChange: 50,
      speakingCompleted: true,
      changeSummary: "Accuracy improved by 50 percentage points.",
    });
    expect(history[1].changeSummary).toContain("first completed lesson");
  });

  it("explains progression to a new topic before comparing scores", () => {
    const history = buildLessonHistory([
      lesson({ id: "first", completedAt: new Date("2026-08-28T10:10:00.000Z") }),
      lesson({
        id: "second",
        lessonKey: "daily-routines-v1",
        completedAt: new Date("2026-08-29T10:10:00.000Z"),
      }),
    ]);

    expect(history[0].changeSummary).toBe(
      "You moved from meet someone new to talk about your morning.",
    );
  });
});
