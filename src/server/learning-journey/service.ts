import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import { learningJourneyChoices, lessonSessions } from "@/server/db/schema";

export type JourneyChoice = "next_lesson" | "review";

const choiceWindowMs = 30 * 60 * 1000;

export async function recordJourneyChoice(input: {
  learnerId: string;
  sessionId: string;
  choice: JourneyChoice;
}) {
  const db = getDatabase();
  const now = new Date();
  const [session] = await db
    .select({ id: lessonSessions.id })
    .from(lessonSessions)
    .where(and(
      eq(lessonSessions.id, input.sessionId),
      eq(lessonSessions.learnerId, input.learnerId),
      eq(lessonSessions.status, "completed"),
      gte(lessonSessions.completedAt, new Date(now.getTime() - choiceWindowMs)),
      lte(lessonSessions.completedAt, now),
    ))
    .limit(1);

  if (!session) throw new Error("COMPLETION_NOT_ELIGIBLE");

  await db.insert(learningJourneyChoices).values({
    learnerId: input.learnerId,
    lessonSessionId: input.sessionId,
    choice: input.choice,
    selectedAt: now,
  }).onConflictDoNothing({
    target: [learningJourneyChoices.lessonSessionId, learningJourneyChoices.choice],
  });
}
