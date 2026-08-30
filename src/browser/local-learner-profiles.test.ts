import { describe, expect, it } from "vitest";
import {
  mergeLocalLearnerProfile,
  parseLocalLearnerProfiles,
} from "./local-learner-profiles";

const kate = {
  learnerId: "10000000-0000-4000-8000-000000000001",
  displayName: "Kate",
};

describe("local learner profiles", () => {
  it("ignores corrupted records and normalizes valid names", () => {
    expect(parseLocalLearnerProfiles(JSON.stringify([
      { ...kate, displayName: "  Kate  " },
      { learnerId: "invalid", displayName: "Broken" },
      kate,
    ]))).toEqual([kate]);
    expect(parseLocalLearnerProfiles("not-json")).toEqual([]);
  });

  it("moves the selected profile first without duplicating it", () => {
    const ana = {
      learnerId: "20000000-0000-4000-8000-000000000002",
      displayName: "Ana",
    };

    expect(mergeLocalLearnerProfile([kate, ana], ana)).toEqual([ana, kate]);
  });
});
