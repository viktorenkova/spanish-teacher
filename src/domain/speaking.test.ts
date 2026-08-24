import { describe, expect, it } from "vitest";
import { assessIntroductionTranscript } from "./speaking";

describe("introduction speaking assessment", () => {
  it("accepts an introduction with both task signals", () => {
    const result = assessIntroductionTranscript("Me llamo Katia. Soy de Rusia.");

    expect(result.complete).toBe(true);
    expect(result.matchedSignals).toEqual(["name", "origin"]);
    expect(result.feedback).toContain("Pronunciation was not assessed");
  });

  it("identifies the missing part without scoring pronunciation", () => {
    const result = assessIntroductionTranscript("Mi nombre es Katia.");

    expect(result.complete).toBe(false);
    expect(result.matchedSignals).toEqual(["name"]);
    expect(result.feedback).toContain("Soy de");
  });
});
