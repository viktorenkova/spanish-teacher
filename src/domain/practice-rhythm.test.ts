import { describe, expect, it } from "vitest";
import { buildPracticeRhythm } from "./practice-rhythm";

describe("practice rhythm", () => {
  it("counts unique local practice days and keeps yesterday's rhythm open", () => {
    const rhythm = buildPracticeRhythm({
      now: new Date("2026-08-30T08:00:00.000Z"),
      timezoneOffsetMinutes: -180,
      completedAt: [
        new Date("2026-08-27T10:00:00.000Z"),
        new Date("2026-08-28T20:30:00.000Z"),
        new Date("2026-08-29T10:00:00.000Z"),
        new Date("2026-08-29T18:00:00.000Z"),
      ],
    });

    expect(rhythm).toMatchObject({
      activeDaysLast7: 3,
      activeDaysLast30: 3,
      currentRunDays: 3,
      practisedToday: false,
      guidance: "One short lesson today would continue your learning rhythm.",
    });
  });

  it("invites a restart after a pause without loss language", () => {
    const rhythm = buildPracticeRhythm({
      now: new Date("2026-08-30T12:00:00.000Z"),
      timezoneOffsetMinutes: 0,
      completedAt: [new Date("2026-08-20T12:00:00.000Z")],
    });

    expect(rhythm.currentRunDays).toBe(0);
    expect(rhythm.guidance).toContain("start a new rhythm");
    expect(rhythm.guidance.toLowerCase()).not.toContain("lost");
  });

  it("treats a late UTC lesson as today in the learner's timezone", () => {
    const rhythm = buildPracticeRhythm({
      now: new Date("2026-08-29T22:15:00.000Z"),
      timezoneOffsetMinutes: -180,
      completedAt: [new Date("2026-08-29T21:30:00.000Z")],
    });

    expect(rhythm.practisedToday).toBe(true);
    expect(rhythm.currentRunDays).toBe(1);
  });
});
