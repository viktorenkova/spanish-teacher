export type A1Band = "early" | "mid" | "strong";
export type AssessedSkill = "vocabulary" | "grammar" | "reading";
export type LearnerSkill = AssessedSkill | "listening" | "speaking";

export type DiagnosticQuestion = {
  id: string;
  skill: AssessedSkill;
  prompt: string;
  context?: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
};

export type SkillEstimate = {
  skill: LearnerSkill;
  status: "assessed" | "unassessed";
  a1Band?: A1Band;
  confidence: number;
  evidenceCount: number;
};

export const diagnosticVersion = "a1-text-v1";

export const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: "greeting",
    skill: "vocabulary",
    prompt: "It is 10:00 in the morning. Which greeting fits?",
    options: [
      { id: "buenos-dias", label: "Buenos días" },
      { id: "buenas-noches", label: "Buenas noches" },
      { id: "hasta-luego", label: "Hasta luego" },
    ],
    correctOptionId: "buenos-dias",
  },
  {
    id: "name",
    skill: "grammar",
    prompt: "Complete the introduction: “Me ___ Ana.”",
    options: [
      { id: "llamo", label: "llamo" },
      { id: "llamas", label: "llamas" },
      { id: "llama", label: "llama" },
    ],
    correctOptionId: "llamo",
  },
  {
    id: "origin",
    skill: "reading",
    prompt: "Read: “Soy de Londres, pero vivo en Madrid.” Where does the speaker live?",
    options: [
      { id: "madrid", label: "In Madrid" },
      { id: "london", label: "In London" },
      { id: "unknown", label: "It does not say" },
    ],
    correctOptionId: "madrid",
  },
  {
    id: "routine",
    skill: "grammar",
    prompt: "Choose the natural sentence about a daily routine.",
    options: [
      { id: "desayuno", label: "Desayuno a las ocho." },
      { id: "desayunas", label: "Desayunas a las ocho yo." },
      { id: "desayunar", label: "Yo desayunar a las ocho." },
    ],
    correctOptionId: "desayuno",
  },
];

function bandForRatio(correct: number, total: number): A1Band {
  if (total === 0 || correct / total <= 0.34) return "early";
  if (correct / total < 1) return "mid";
  return "strong";
}

export function evaluateDiagnostic(answers: Record<string, string>) {
  const scored = diagnosticQuestions.map((question) => ({
    ...question,
    correct: answers[question.id] === question.correctOptionId,
  }));
  const score = scored.filter((answer) => answer.correct).length;
  const assessedSkills: AssessedSkill[] = ["vocabulary", "grammar", "reading"];
  const skillEstimates: SkillEstimate[] = assessedSkills.map((skill) => {
    const evidence = scored.filter((answer) => answer.skill === skill);
    const correct = evidence.filter((answer) => answer.correct).length;
    return {
      skill,
      status: "assessed",
      a1Band: bandForRatio(correct, evidence.length),
      confidence: Math.min(60, 25 + evidence.length * 15),
      evidenceCount: evidence.length,
    };
  });

  skillEstimates.push(
    { skill: "listening", status: "unassessed", confidence: 0, evidenceCount: 0 },
    { skill: "speaking", status: "unassessed", confidence: 0, evidenceCount: 0 },
  );

  return {
    version: diagnosticVersion,
    score,
    maxScore: diagnosticQuestions.length,
    overallBand: bandForRatio(score, diagnosticQuestions.length),
    skillEstimates,
  };
}

