import { describe, expect, it } from "vitest";
import { buildLessonPlan, supportedSessionDurations } from "./lesson-planner";

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
});
