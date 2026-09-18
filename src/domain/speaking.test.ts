import { describe, expect, it } from "vitest";
import {
  assessCafeOrderTranscript,
  assessDirectionsTranscript,
  assessFamilyTranscript,
  assessFreeTimeTranscript,
  assessHotelCheckinTranscript,
  assessIntroductionTranscript,
  assessMakingPlansTranscript,
  assessMorningRoutineTranscript,
  assessRestaurantTranscript,
  assessShoppingTranscript,
  assessTransportTranscript,
  assessWeatherTranscript,
  getSpeakingAssessor,
} from "./speaking";

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

describe("morning routine speaking assessment", () => {
  it("requires both routine actions and does not claim pronunciation scoring", () => {
    const result = assessMorningRoutineTranscript("Me levanto a las siete y desayuno.");

    expect(result.complete).toBe(true);
    expect(result.matchedSignals).toEqual(["get_up", "breakfast"]);
    expect(result.feedback).toContain("Pronunciation was not assessed");
  });
});

describe("cafe-order speaking assessment", () => {
  it("requires a request and polite ending without scoring pronunciation", () => {
    const result = assessCafeOrderTranscript("Quiero un café y agua, por favor.");

    expect(result.complete).toBe(true);
    expect(result.matchedSignals).toEqual(["request", "two_items", "politeness"]);
    expect(result.feedback).toContain("Pronunciation was not assessed");
  });

  it("does not complete the task when only one item is ordered", () => {
    const result = assessCafeOrderTranscript("Quiero un café, por favor.");

    expect(result.complete).toBe(false);
    expect(result.matchedSignals).toEqual(["request", "politeness"]);
    expect(result.feedback).toContain("two cafe items");
  });
});

describe("speaking assessor registry", () => {
  it("selects deterministic assessment behavior by task metadata", () => {
    const result = getSpeakingAssessor("morning-routine")(
      "Me levanto a las ocho y desayuno.",
    );

    expect(result.complete).toBe(true);
    expect(result.version).toBe("morning-routine-task-v1");
  });

  it.each([
    ["shopping", assessShoppingTranscript("Quiero medio kilo de tomates. ¿Cuánto cuesta?")],
    ["directions", assessDirectionsTranscript("Perdona, ¿dónde está la estación?")],
    ["transport", assessTransportTranscript("Un billete para Toledo, por favor.")],
    ["hotel-checkin", assessHotelCheckinTranscript("Tengo una reserva a nombre de García.")],
    ["restaurant", assessRestaurantTranscript("Para mí, la tortilla. La cuenta, por favor.")],
    ["family", assessFamilyTranscript("Mi hermana se llama Ana y vive en Valencia.")],
    ["free-time", assessFreeTimeTranscript("A veces leo por la tarde.")],
    ["making-plans", assessMakingPlansTranscript("Puedo el sábado. Quedamos a las seis.")],
    ["weather", assessWeatherTranscript("Hace frío. Tengo frío.")],
  ] as const)("completes the %s A1 task from transcript evidence", (_id, result) => {
    expect(result.complete).toBe(true);
    expect(result.feedback).toContain("Pronunciation was not assessed");
  });
});
