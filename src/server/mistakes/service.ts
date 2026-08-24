import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  applyMistakeEvidence,
  type MistakeMemory,
  type MistakeState,
} from "@/domain/mistake";
import { getDatabase } from "@/server/db/client";
import { learnerMistakes, mistakeEvents } from "@/server/db/schema";
import type { TeacherCorrection } from "@/teacher/provider";

function stateOf(row: typeof learnerMistakes.$inferSelect): MistakeState {
  return {
    occurrenceCount: row.occurrenceCount,
    successfulEvidenceCount: row.successfulEvidenceCount,
    status: row.status as MistakeState["status"],
  };
}

export async function updateMistakeMemory(input: {
  learnerId: string;
  learningItemId: string;
  exerciseAttemptId: string;
  corrections: TeacherCorrection[];
  taskComplete: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const db = getDatabase();

  await db.transaction(async (transaction) => {
    if (input.corrections.length > 0) {
      for (const correction of input.corrections) {
        const [existing] = await transaction
          .select()
          .from(learnerMistakes)
          .where(
            and(
              eq(learnerMistakes.learnerId, input.learnerId),
              eq(learnerMistakes.learningItemId, input.learningItemId),
              eq(learnerMistakes.code, correction.code),
            ),
          )
          .limit(1);
        const next = applyMistakeEvidence(existing ? stateOf(existing) : undefined, "observed");
        if (!next) continue;

        const [mistake] = await transaction
          .insert(learnerMistakes)
          .values({
            learnerId: input.learnerId,
            learningItemId: input.learningItemId,
            code: correction.code,
            category: correction.category,
            targetPattern: correction.suggestion,
            explanation: correction.explanation,
            ...next,
            firstSeenAt: existing?.firstSeenAt ?? now,
            lastSeenAt: now,
            resolvedAt: null,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [learnerMistakes.learnerId, learnerMistakes.learningItemId, learnerMistakes.code],
            set: {
              category: correction.category,
              targetPattern: correction.suggestion,
              explanation: correction.explanation,
              ...next,
              lastSeenAt: now,
              resolvedAt: null,
              updatedAt: now,
            },
          })
          .returning({ id: learnerMistakes.id });

        await transaction
          .insert(mistakeEvents)
          .values({
            mistakeId: mistake.id,
            exerciseAttemptId: input.exerciseAttemptId,
            kind: "observed",
            createdAt: now,
          })
          .onConflictDoNothing();
      }
      return;
    }

    if (!input.taskComplete) return;
    const outstanding = await transaction
      .select()
      .from(learnerMistakes)
      .where(
        and(
          eq(learnerMistakes.learnerId, input.learnerId),
          eq(learnerMistakes.learningItemId, input.learningItemId),
          inArray(learnerMistakes.status, ["active", "improving"]),
        ),
      );

    for (const existing of outstanding) {
      const next = applyMistakeEvidence(stateOf(existing), "successful_evidence");
      if (!next) continue;
      await transaction
        .update(learnerMistakes)
        .set({
          ...next,
          resolvedAt: next.status === "resolved" ? now : null,
          updatedAt: now,
        })
        .where(eq(learnerMistakes.id, existing.id));
      await transaction
        .insert(mistakeEvents)
        .values({
          mistakeId: existing.id,
          exerciseAttemptId: input.exerciseAttemptId,
          kind: "successful_evidence",
          createdAt: now,
        })
        .onConflictDoNothing();
    }
  });

  return loadMistakeMemory(input.learnerId);
}

export async function loadMistakeMemory(learnerId: string): Promise<MistakeMemory> {
  const rows = await getDatabase()
    .select()
    .from(learnerMistakes)
    .where(
      and(
        eq(learnerMistakes.learnerId, learnerId),
        inArray(learnerMistakes.status, ["active", "improving"]),
      ),
    )
    .orderBy(desc(learnerMistakes.updatedAt));

  return {
    outstandingCount: rows.length,
    items: rows.map((row) => ({
      code: row.code,
      category: row.category,
      targetPattern: row.targetPattern,
      explanation: row.explanation,
      occurrenceCount: row.occurrenceCount,
      successfulEvidenceCount: row.successfulEvidenceCount,
      status: row.status as MistakeState["status"],
    })),
  };
}
