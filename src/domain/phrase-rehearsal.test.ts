import { describe, expect, it } from "vitest";
import { assessPhraseRehearsal } from "./phrase-rehearsal";

describe("phrase rehearsal assessment", () => {
  it("accepts a full phrase despite case, accents, and punctuation differences", () => {
    expect(assessPhraseRehearsal(
      "¿Cuánto cuesta?",
      "cuanto cuesta",
    )).toMatchObject({
      status: "matched",
      matchedWordCount: 2,
      targetWordCount: 2,
    });
  });

  it("accepts learner words inside an open phrase template", () => {
    expect(assessPhraseRehearsal(
      "Mi… se llama… y vive/trabaja…",
      "Mi hermana se llama Ana y trabaja en Madrid",
    )).toMatchObject({
      status: "matched",
      matchedWordCount: 5,
      targetWordCount: 5,
    });
  });

  it("uses either side of a phrase-level alternative", () => {
    expect(assessPhraseRehearsal(
      "Puedo… / Quedamos…",
      "Quedamos el sábado",
    )).toMatchObject({
      status: "matched",
      matchedWordCount: 1,
      targetWordCount: 1,
    });
  });

  it("distinguishes partial evidence from a different transcript", () => {
    const partial = assessPhraseRehearsal(
      "Quiero un café, por favor.",
      "quiero un cafe",
    );
    expect(partial).toMatchObject({
      status: "close",
      missingWords: ["por", "favor"],
    });
    expect(partial.feedback).toContain("Focus on: por, favor.");

    const different = assessPhraseRehearsal(
      "Quiero un café, por favor.",
      "buenos dias",
    );
    expect(different).toMatchObject({
      status: "retry",
      missingWords: ["quiero", "un", "cafe", "por", "favor"],
    });
  });
});
