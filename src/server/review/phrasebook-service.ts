import "server-only";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import { exerciseAttempts, learnerItemStates } from "@/server/db/schema";
import { scheduleReview, storeCard } from "./scheduler";

export class PhrasebookItemNotFoundError extends Error {
  constructor() {
    super("This phrase is not in the learner's saved phrasebook.");
    this.name = "PhrasebookItemNotFoundError";
  }
}

export async function recordPhrasebookSelfCheck(input: {
  learnerId: string;
  learningItemId: string;
  remembered: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return getDatabase().transaction(async (transaction) => {
    const [state] = await transaction
      .select()
      .from(learnerItemStates)
      .where(and(
        eq(learnerItemStates.learnerId, input.learnerId),
        eq(learnerItemStates.learningItemId, input.learningItemId),
      ))
      .for("update")
      .limit(1);
    if (!state) throw new PhrasebookItemNotFoundError();

    const scheduled = scheduleReview(state, input.remembered, now);
    const card = storeCard(scheduled.card);
    await transaction
      .update(learnerItemStates)
      .set({ ...card, updatedAt: now })
      .where(eq(learnerItemStates.id, state.id));
    await transaction.insert(exerciseAttempts).values({
      learnerId: input.learnerId,
      learningItemId: input.learningItemId,
      lessonKey: "phrasebook-self-check",
      exerciseId: "phrasebook-self-check",
      modality: "recall",
      selectedOptionId: input.remembered ? "remembered" : "help",
      evidenceProvider: "phrasebook-self-check",
      correct: input.remembered,
      fsrsRating: scheduled.rating,
      scheduledDue: card.due,
      occurredAt: now,
    });
    return { nextReviewAt: card.due.toISOString() };
  });
}
