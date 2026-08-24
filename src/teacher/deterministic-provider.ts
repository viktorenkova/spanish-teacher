import type {
  TeacherCorrection,
  TeacherFeedback,
  TeacherFeedbackRequest,
  TeacherProvider,
} from "./provider";

function normalized(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-zñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class DeterministicTeacherProvider implements TeacherProvider {
  readonly id = "local-teacher";
  readonly version = "introduction-feedback-v1";

  async generateFeedback(request: TeacherFeedbackRequest): Promise<TeacherFeedback> {
    const text = normalized(request.transcript);
    const corrections: TeacherCorrection[] = [];

    if (!request.assessment.matchedSignals.includes("name")) {
      corrections.push(
        /\bmi llamo\b/.test(text)
          ? {
              code: "name_pronoun_mi",
              category: "grammar",
              issue: "Use “me”, not “mi”, with llamo.",
              suggestion: "Me llamo…",
              explanation: "This is the natural Spanish phrase for giving your name.",
            }
          : {
              code: "name_construction_missing",
              category: "task_completeness",
              issue: "Your name phrase was not clear in the transcript.",
              suggestion: "Me llamo…",
              explanation: "Start with this complete phrase, then add your name.",
            },
      );
    }

    if (!request.assessment.matchedSignals.includes("origin")) {
      corrections.push(
        /\bsoy\b/.test(text) && !/\bsoy de\b/.test(text)
          ? {
              code: "origin_preposition_de",
              category: "grammar",
              issue: "The place needs “de” after “soy”.",
              suggestion: "Soy de…",
              explanation: "Use “de” to say where you are from.",
            }
          : {
              code: "origin_construction_missing",
              category: "task_completeness",
              issue: "Your origin phrase was not clear in the transcript.",
              suggestion: "Soy de…",
              explanation: "Use this phrase before your country or city.",
            },
      );
    }

    return {
      summary: request.assessment.complete
        ? "You completed the introduction task."
        : "You made a useful start; add the missing part and try again.",
      praise: request.assessment.complete
        ? "You connected two practical A1 phrases in one answer."
        : "You spoke in Spanish and gave the coach real language to work with.",
      corrections,
      nextStep: request.assessment.complete
        ? "Say the same introduction once more without reading the prompt."
        : "Record another answer using the suggested phrase or phrases.",
      providerId: this.id,
      providerVersion: this.version,
      generationMode: "deterministic",
    };
  }
}
