export const learnerPrimaryGoals = ["conversation", "travel", "daily-life"] as const;
export type LearnerPrimaryGoal = (typeof learnerPrimaryGoals)[number];

export const learnerPrimaryGoalLabels: Record<LearnerPrimaryGoal, string> = {
  conversation: "Speak in everyday conversations",
  travel: "Use Spanish while travelling",
  "daily-life": "Build a steady daily habit",
};
