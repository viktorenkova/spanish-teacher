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
    expect(assessPhraseRehearsal(
      "Quiero un café, por favor.",
      "quiero un cafe",
    ).status).toBe("close");
    expect(assessPhraseRehearsal(
      "Quiero un café, por favor.",
      "buenos dias",
    ).status).toBe("retry");
  });
});
