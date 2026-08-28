import { describe, expect, it } from "vitest";
import { summariseLearnerProgress } from "./progress";

describe("learner progress summary", () => {
  it("reports useful review and speaking signals without treating attempts as learned items", () => {
    const now = new Date("2026-08-28T12:00:00.000Z");
    const summary = summariseLearnerProgress({
      now,
      itemStates: [
        { learningItemId: "phrase:name", due: new Date("2026-08-28T11:00:00.000Z") },
        { learningItemId: "phrase:origin", due: new Date("2026-08-29T09:00:00.000Z") },
      ],
      evidence: [
        { learningItemId: "phrase:name", modality: "recall", correct: true, occurredAt: now },
        { learningItemId: "phrase:name", modality: "recognition", correct: true, occurredAt: now },
        { learningItemId: "phrase:origin", modality: "production", correct: true, occurredAt: new Date("2026-08-27T12:00:00.000Z") },
      ],
    });

    expect(summary).toEqual({
      introducedItemCount: 2,
      reviewedTodayCount: 1,
      dueReviewCount: 1,
      nextReviewAt: "2026-08-29T09:00:00.000Z",
      hasCompletedSpeakingTask: true,
    });
  });
});
