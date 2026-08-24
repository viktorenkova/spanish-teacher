import type { SpeakingAssessment } from "@/domain/speaking";

export type TeacherCorrection = {
  code:
    | "name_pronoun_mi"
    | "name_construction_missing"
    | "origin_preposition_de"
    | "origin_construction_missing";
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
