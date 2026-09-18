import type {
  TeacherCorrection,
  TeacherFeedback,
  TeacherFeedbackRequest,
  TeacherProvider,
} from "./provider";
import type { SpeakingAssessment } from "@/domain/speaking";

type Signal = SpeakingAssessment["matchedSignals"][number];

const focusedTaskCorrections: Partial<Record<SpeakingAssessment["version"], Array<{
  signal: Signal;
  correction: TeacherCorrection;
}>>> = {
  "shopping-task-v1": [
    { signal: "quantity", correction: { code: "quantity_missing", category: "task_completeness", issue: "The quantity was not clear in the transcript.", suggestion: "Medio kilo de…", explanation: "Add a simple quantity before the product." } },
    { signal: "product", correction: { code: "product_missing", category: "task_completeness", issue: "The product was not clear in the transcript.", suggestion: "…tomates / manzanas / pan", explanation: "Name the thing you want to buy." } },
    { signal: "price_question", correction: { code: "price_question_missing", category: "task_completeness", issue: "The price question was missing.", suggestion: "¿Cuánto cuesta?", explanation: "Use this question after choosing the product." } },
  ],
  "directions-task-v1": [
    { signal: "direction_question", correction: { code: "direction_question_missing", category: "task_completeness", issue: "The directions question was not clear.", suggestion: "¿Dónde está…?", explanation: "Use this pattern to ask where a place is." } },
    { signal: "place", correction: { code: "place_missing", category: "task_completeness", issue: "The place was not clear in the transcript.", suggestion: "…la estación / el museo / el hotel", explanation: "Add the place you want to find." } },
  ],
  "transport-task-v1": [
    { signal: "ticket", correction: { code: "ticket_missing", category: "task_completeness", issue: "The ticket request was not clear.", suggestion: "Un billete…", explanation: "Start with a simple ticket request." } },
    { signal: "destination", correction: { code: "destination_missing", category: "task_completeness", issue: "The destination was missing.", suggestion: "…para Valencia, por favor.", explanation: "Add the city after “para”." } },
  ],
  "hotel-checkin-task-v1": [
    { signal: "reservation", correction: { code: "reservation_missing", category: "task_completeness", issue: "The reservation was not mentioned clearly.", suggestion: "Tengo una reserva.", explanation: "Use this phrase to begin a hotel check-in." } },
    { signal: "booking_name", correction: { code: "booking_name_missing", category: "task_completeness", issue: "The booking name was missing.", suggestion: "A nombre de…", explanation: "Use this phrase before the name on the booking." } },
  ],
  "restaurant-task-v1": [
    { signal: "food_order", correction: { code: "food_order_missing", category: "task_completeness", issue: "The food order was not clear.", suggestion: "Para mí, la tortilla.", explanation: "Name one dish after a simple ordering phrase." } },
    { signal: "bill_request", correction: { code: "bill_request_missing", category: "task_completeness", issue: "The bill request was missing.", suggestion: "La cuenta, por favor.", explanation: "Use this phrase when you want to pay." } },
  ],
  "family-task-v1": [
    { signal: "family_member", correction: { code: "family_member_missing", category: "task_completeness", issue: "A family member was not clear in the transcript.", suggestion: "Mi hermana…", explanation: "Start by naming one family member." } },
    { signal: "family_detail", correction: { code: "family_detail_missing", category: "task_completeness", issue: "A detail about the person was missing.", suggestion: "…se llama Ana / vive en Madrid.", explanation: "Add one simple detail such as a name or city." } },
  ],
  "free-time-task-v1": [
    { signal: "leisure_activity", correction: { code: "leisure_activity_missing", category: "task_completeness", issue: "The leisure activity was not clear.", suggestion: "Leo / corro / cocino…", explanation: "Say one activity you do in your free time." } },
    { signal: "frequency", correction: { code: "frequency_missing", category: "task_completeness", issue: "The time or frequency was missing.", suggestion: "A veces… / Los fines de semana…", explanation: "Add when or how often you do the activity." } },
  ],
  "making-plans-task-v1": [
    { signal: "availability", correction: { code: "availability_missing", category: "task_completeness", issue: "Your availability was not clear.", suggestion: "Puedo… / Quedamos…", explanation: "Use one of these phrases to make a plan." } },
    { signal: "plan_time", correction: { code: "plan_time_missing", category: "task_completeness", issue: "The day or time was missing.", suggestion: "…el sábado / a las seis.", explanation: "Add a day or a meeting time." } },
  ],
  "weather-task-v1": [
    { signal: "weather_condition", correction: { code: "weather_condition_missing", category: "task_completeness", issue: "The weather condition was not clear.", suggestion: "Hace frío / Hace sol.", explanation: "Start with one simple weather phrase." } },
    { signal: "weather_feeling", correction: { code: "weather_feeling_missing", category: "task_completeness", issue: "A personal comment was missing.", suggestion: "Tengo frío / Necesito una chaqueta.", explanation: "Add how the weather affects you." } },
  ],
};

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

    if (request.assessment.version !== "introduction-task-v1") {
      const focused = focusedTaskCorrections[request.assessment.version];
      if (focused) {
        const missing = focused
          .filter(({ signal }) => !request.assessment.matchedSignals.includes(signal))
          .map(({ correction }) => correction);
        return {
          summary: request.assessment.complete
            ? "You completed the speaking task."
            : "You made a useful start; add the missing part and try again.",
          praise: request.assessment.complete
            ? "You used the target Spanish clearly enough to complete the task."
            : "You spoke in Spanish and gave the coach useful evidence for the next attempt.",
          corrections: missing,
          nextStep: request.assessment.complete
            ? "Say the answer once more without reading the full prompt."
            : "Record another answer using the focused suggestion above.",
          providerId: this.id,
          providerVersion: `${request.assessment.version.replace("task-v1", "feedback-v1")}`,
          generationMode: "deterministic",
        };
      }
      return {
        summary: request.assessment.complete
          ? "You completed the speaking task."
          : "You made a useful start; add the missing part and try again.",
        praise: request.assessment.complete
          ? "You used the target Spanish clearly enough to complete the task."
          : "You spoke in Spanish and gave the coach useful evidence for the next attempt.",
        corrections: request.assessment.complete
          ? []
          : [{
              code: "speaking_task_incomplete",
              category: "task_completeness",
              issue: "One or more required parts were not clear in the transcript.",
              suggestion: request.assessment.feedback,
              explanation: "Use the task prompt and the suggested phrase, then record one more answer.",
            }],
        nextStep: request.assessment.complete
          ? "Say the answer once more without reading the full prompt."
          : "Record another answer and include the missing part shown above.",
        providerId: this.id,
        providerVersion: "generic-speaking-feedback-v1",
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
