import { createEmptyCard, fsrs, Rating, type Card, type CardInput } from "ts-fsrs";

export type StoredFsrsCard = {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: Date | null;
};

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
  enable_short_term: true,
});

export function restoreCard(stored: StoredFsrsCard): CardInput {
  return {
    due: stored.due,
    stability: stored.stability,
    difficulty: stored.difficulty,
    elapsed_days: stored.elapsedDays,
    scheduled_days: stored.scheduledDays,
    learning_steps: stored.learningSteps,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state,
    last_review: stored.lastReview,
  };
}

export function scheduleReview(
  stored: StoredFsrsCard | undefined,
  correct: boolean,
  now = new Date(),
) {
  const card = stored ? restoreCard(stored) : createEmptyCard(now);
  const rating = correct ? Rating.Good : Rating.Again;
  const result = scheduler.next(card, now, rating);

  return { card: result.card, rating, log: result.log };
}

export function storeCard(card: Card): StoredFsrsCard {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ?? null,
  };
}
