export type ProgressEvidence = {
  learningItemId: string;
  modality: "recognition" | "recall" | "listening" | "production";
  occurredAt: Date;
  correct: boolean;
};

export type ReviewStateSnapshot = {
  learningItemId: string;
  due: Date;
};

export type LearnerProgressSummary = {
  introducedItemCount: number;
  reviewedTodayCount: number;
  dueReviewCount: number;
  nextReviewAt?: string;
  hasCompletedSpeakingTask: boolean;
};

function isSameUtcDay(first: Date, second: Date) {
  return first.getUTCFullYear() === second.getUTCFullYear()
    && first.getUTCMonth() === second.getUTCMonth()
    && first.getUTCDate() === second.getUTCDate();
}

export function summariseLearnerProgress(input: {
  itemStates: ReviewStateSnapshot[];
  evidence: ProgressEvidence[];
  now: Date;
}): LearnerProgressSummary {
  const reviewedToday = new Set(
    input.evidence
      .filter((attempt) => isSameUtcDay(attempt.occurredAt, input.now))
      .map((attempt) => attempt.learningItemId),
  );
  const futureReviews = input.itemStates
    .map((item) => item.due)
    .filter((due) => due.getTime() > input.now.getTime())
    .sort((first, second) => first.getTime() - second.getTime());

  return {
    introducedItemCount: input.itemStates.length,
    reviewedTodayCount: reviewedToday.size,
    dueReviewCount: input.itemStates.filter((item) => item.due.getTime() <= input.now.getTime()).length,
    nextReviewAt: futureReviews[0]?.toISOString(),
    hasCompletedSpeakingTask: input.evidence.some(
      (attempt) => attempt.modality === "production" && attempt.correct,
    ),
  };
}
