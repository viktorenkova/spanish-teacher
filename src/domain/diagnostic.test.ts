import { describe, expect, it } from "vitest";
import { diagnosticQuestions, evaluateDiagnostic } from "./diagnostic";

describe("A1 diagnostic", () => {
  it("classifies a fully correct result as strong A1", () => {
    const answers = Object.fromEntries(
      diagnosticQuestions.map((question) => [question.id, question.correctOptionId]),
    );
    const result = evaluateDiagnostic(answers);

    expect(result.overallBand).toBe("strong");
    expect(result.score).toBe(result.maxScore);
  });

  it("does not pretend to assess speaking or listening from text", () => {
    const result = evaluateDiagnostic({});

    expect(result.skillEstimates.find(({ skill }) => skill === "speaking")?.status).toBe(
      "unassessed",
    );
    expect(result.skillEstimates.find(({ skill }) => skill === "listening")?.status).toBe(
      "unassessed",
    );
  });
});

