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

    if (request.assessment.version === "cafe-order-task-v1") {
      if (!request.assessment.matchedSignals.includes("request")) {
        corrections.push({
          code: "cafe_request_missing",
          category: "task_completeness",
          issue: "The request was not clear in the transcript.",
          suggestion: "Quiero…",
          explanation: "Start with this phrase, then name what you want.",
        });
      }
      if (!request.assessment.matchedSignals.includes("two_items")) {
        corrections.push({
          code: "order_items_missing",
          category: "task_completeness",
          issue: "Two cafe items were not clear in the transcript.",
          suggestion: "Un café y agua.",
          explanation: "Join two items with “y” to complete this practice task.",
        });
      }
      if (!request.assessment.matchedSignals.includes("politeness")) {
        corrections.push({
          code: "politeness_missing",
          category: "task_completeness",
          issue: "The polite ending was missing from the transcript.",
          suggestion: "Por favor.",
          explanation: "Add this at the end of a short order to say “please.”",
        });
      }

      return {
        summary: request.assessment.complete
          ? "You completed the cafe order."
          : "You made a useful start; complete the request and try again.",
        praise: request.assessment.complete
          ? "You used a practical request and a polite ending together."
          : "You spoke as a customer and gave the coach useful language to improve.",
        corrections,
        nextStep: request.assessment.complete
          ? "Make the order once more with two different items."
          : "Record another order using the suggested phrase or phrases.",
        providerId: this.id,
        providerVersion: "cafe-order-feedback-v1",
        generationMode: "deterministic",
      };
    }

    if (request.assessment.version === "morning-routine-task-v1") {
      if (!request.assessment.matchedSignals.includes("get_up")) {
        corrections.push({
          code: "get_up_construction_missing",
          category: "task_completeness",
          issue: "The getting-up action was not clear in the transcript.",
          suggestion: "Me levanto a las…",
          explanation: "Use this phrase to say what time you get up.",
        });
      }
      if (!request.assessment.matchedSignals.includes("breakfast")) {
        corrections.push({
          code: "breakfast_action_missing",
          category: "task_completeness",
          issue: "The breakfast action was not clear in the transcript.",
          suggestion: "Desayuno.",
          explanation: "This single verb means “I have breakfast.”",
        });
      }

      return {
        summary: request.assessment.complete
          ? "You completed the morning routine task."
          : "You made a useful start; add the missing action and try again.",
        praise: request.assessment.complete
          ? "You connected two everyday A1 actions in one answer."
          : "You spoke about your real routine and gave the coach useful evidence.",
        corrections,
        nextStep: request.assessment.complete
          ? "Say the routine once more with a different time."
          : "Record another answer using the suggested action or actions.",
        providerId: this.id,
        providerVersion: "morning-routine-feedback-v1",
        generationMode: "deterministic",
      };
    }

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
