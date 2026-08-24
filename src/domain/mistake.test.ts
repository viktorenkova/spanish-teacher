import { describe, expect, it } from "vitest";
import { applyMistakeEvidence } from "./mistake";

describe("long-term mistake state", () => {
  it("records recurrence and resets improvement evidence", () => {
    const first = applyMistakeEvidence(undefined, "observed");
    const improving = applyMistakeEvidence(first, "successful_evidence");
    const recurring = applyMistakeEvidence(improving, "observed");

    expect(recurring).toEqual({
      occurrenceCount: 2,
      successfulEvidenceCount: 0,
      status: "active",
    });
  });

  it("requires two successful observations to resolve a pattern", () => {
    const active = applyMistakeEvidence(undefined, "observed");
    const improving = applyMistakeEvidence(active, "successful_evidence");
    const resolved = applyMistakeEvidence(improving, "successful_evidence");

    expect(improving?.status).toBe("improving");
    expect(resolved?.status).toBe("resolved");
  });
});
