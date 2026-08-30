export const learnerPrimaryGoals = ["conversation", "travel", "daily-life"] as const;
export type LearnerPrimaryGoal = (typeof learnerPrimaryGoals)[number];

export const learnerPrimaryGoalLabels: Record<LearnerPrimaryGoal, string> = {
  conversation: "Speak in everyday conversations",
  travel: "Use Spanish while travelling",
  "daily-life": "Build a steady daily habit",
};

export const learnerPrimaryGoalPlanFocus: Record<LearnerPrimaryGoal, string> = {
  conversation: "Build confidence for short everyday conversations.",
  travel: "Prepare useful language for simple travel interactions.",
  "daily-life": "Build a small, repeatable Spanish practice habit.",
};

export function isLearnerPrimaryGoal(value: string): value is LearnerPrimaryGoal {
  return learnerPrimaryGoals.includes(value as LearnerPrimaryGoal);
}
