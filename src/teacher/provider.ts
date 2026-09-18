import type { SpeakingAssessment } from "@/domain/speaking";

export type TeacherCorrection = {
  code:
    | "name_pronoun_mi"
    | "name_construction_missing"
    | "origin_preposition_de"
    | "origin_construction_missing"
    | "get_up_construction_missing"
    | "breakfast_action_missing"
    | "cafe_request_missing"
    | "order_items_missing"
    | "politeness_missing"
    | "quantity_missing"
    | "product_missing"
    | "price_question_missing"
    | "direction_question_missing"
    | "place_missing"
    | "ticket_missing"
    | "destination_missing"
    | "reservation_missing"
    | "booking_name_missing"
    | "food_order_missing"
    | "bill_request_missing"
    | "family_member_missing"
    | "family_detail_missing"
    | "leisure_activity_missing"
    | "frequency_missing"
    | "availability_missing"
    | "plan_time_missing"
    | "weather_condition_missing"
    | "weather_feeling_missing"
    | "speaking_task_incomplete";
  category: "grammar" | "task_completeness";
  issue: string;
  suggestion: string;
  explanation: string;
};

export type TeacherFeedback = {
  summary: string;
  praise: string;
  corrections: TeacherCorrection[];
  nextStep: string;
  providerId: string;
  providerVersion: string;
  generationMode: "deterministic" | "language-model";
};

export type TeacherFeedbackRequest = {
  transcript: string;
  objective: string;
  assessment: SpeakingAssessment;
  targetLocale: "es-ES";
  targetLevel: "A1";
  supportLanguage: "en";
  supportLevel: "B1";
};

export interface TeacherProvider {
  readonly id: string;
  readonly version: string;
  generateFeedback(request: TeacherFeedbackRequest): Promise<TeacherFeedback>;
}
