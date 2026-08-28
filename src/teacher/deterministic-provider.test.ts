import { describe, expect, it } from "vitest";
import {
  assessCafeOrderTranscript,
  assessIntroductionTranscript,
  assessMorningRoutineTranscript,
} from "../domain/speaking";
import { DeterministicTeacherProvider } from "./deterministic-provider";

const provider = new DeterministicTeacherProvider();

function request(transcript: string) {
  return {
    transcript,
    objective: "Give your name and where you are from.",
    assessment: assessIntroductionTranscript(transcript),
    targetLocale: "es-ES" as const,
    targetLevel: "A1" as const,
    supportLanguage: "en" as const,
    supportLevel: "B1" as const,
  };
}

describe("deterministic teacher provider", () => {
  it("praises a complete task without inventing corrections", async () => {
    const feedback = await provider.generateFeedback(request("Me llamo Katia. Soy de Rusia."));

    expect(feedback.corrections).toEqual([]);
    expect(feedback.summary).toContain("completed");
    expect(feedback.generationMode).toBe("deterministic");
  });

  it("gives a focused correction for common introduction errors", async () => {
    const feedback = await provider.generateFeedback(request("Mi llamo Katia. Soy Rusia."));

    expect(feedback.corrections.map(({ suggestion }) => suggestion)).toEqual([
      "Me llamo…",
      "Soy de…",
    ]);
  });

  it("gives feedback for the daily-routine speaking objective", async () => {
    const transcript = "Me levanto a las siete.";
    const feedback = await provider.generateFeedback({
      ...request(transcript),
      objective: "Say when you get up and that you have breakfast.",
      assessment: assessMorningRoutineTranscript(transcript),
    });

    expect(feedback.corrections.map(({ code }) => code)).toEqual(["breakfast_action_missing"]);
    expect(feedback.nextStep).toContain("another answer");
  });

  it("gives focused feedback for an incomplete cafe order", async () => {
    const transcript = "Un café y agua.";
    const feedback = await provider.generateFeedback({
      ...request(transcript),
      objective: "Order two things politely.",
      assessment: assessCafeOrderTranscript(transcript),
    });

    expect(feedback.corrections.map(({ code }) => code)).toEqual([
      "cafe_request_missing",
      "politeness_missing",
    ]);
  });
});
