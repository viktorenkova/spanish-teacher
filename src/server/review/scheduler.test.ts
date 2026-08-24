import { describe, expect, it } from "vitest";
import { scheduleReview, storeCard } from "./scheduler";

describe("FSRS review scheduling", () => {
  it("schedules a new correct item into the future", () => {
    const now = new Date("2026-08-24T10:00:00.000Z");
    const result = scheduleReview(undefined, true, now);

    expect(result.card.due.getTime()).toBeGreaterThan(now.getTime());
    expect(result.card.reps).toBe(1);
  });

  it("can restore and advance a persisted card", () => {
    const firstTime = new Date("2026-08-24T10:00:00.000Z");
    const first = scheduleReview(undefined, true, firstTime);
    const second = scheduleReview(storeCard(first.card), true, first.card.due);

    expect(second.card.reps).toBe(2);
    expect(second.card.last_review?.toISOString()).toBe(first.card.due.toISOString());
  });
});

