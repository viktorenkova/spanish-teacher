import { describe, expect, it } from "vitest";
import { parseOnboardingDraft } from "./onboarding-draft";

describe("onboarding draft", () => {
  it("keeps only supported local preferences and diagnostic selections", () => {
    const draft = parseOnboardingDraft(JSON.stringify({
      step: "diagnostic",
      displayName: "Katia",
      primaryGoal: "travel",
      priorExperience: "returning",
      preferredSessionMinutes: 20,
      answers: { greeting: "not-a-choice", name: "llamo" },
    }));
    expect(draft).toMatchObject({
      step: "diagnostic",
      displayName: "Katia",
      primaryGoal: "travel",
      priorExperience: "returning",
      preferredSessionMinutes: 20,
      answers: { name: "llamo" },
    });
  });

  it("ignores malformed and unsupported draft fields", () => {
    expect(parseOnboardingDraft("{").step).toBe("profile");
    expect(parseOnboardingDraft(JSON.stringify({ primaryGoal: "invalid", preferredSessionMinutes: 999 })))
      .toMatchObject({ primaryGoal: "conversation", preferredSessionMinutes: 10 });
  });
});
