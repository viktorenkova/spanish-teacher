import "server-only";
import { and, eq } from "drizzle-orm";
import type {
  PilotFeedback,
  PilotFeedbackMicrophone,
  PilotFeedbackPacing,
  PilotFeedbackReadingTime,
} from "@/domain/pilot-feedback";
import { getServerEnvironment } from "@/server/config/environment";
import { getDatabase } from "@/server/db/client";
import { lessonSessions, pilotFeedback } from "@/server/db/schema";

type PilotFeedbackInput = {
  learnerId: string;
  sessionId: string;
  overallRating: number;
  pacing: PilotFeedbackPacing;
  readingTime: PilotFeedbackReadingTime;
  microphoneCapture: PilotFeedbackMicrophone;
  comment?: string;
  now?: Date;
};

function serialiseFeedback(row: typeof pilotFeedback.$inferSelect): PilotFeedback {
  return {
    id: row.id,
    learnerId: row.learnerId,
    sessionId: row.lessonSessionId,
    overallRating: row.overallRating,
    pacing: row.pacing as PilotFeedbackPacing,
    readingTime: row.readingTime as PilotFeedbackReadingTime,
    microphoneCapture: row.microphoneCapture as PilotFeedbackMicrophone,
    comment: row.comment ?? undefined,
    appVersion: row.appVersion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function loadPilotFeedback(learnerId: string, sessionId: string) {
  const [saved] = await getDatabase()
    .select()
    .from(pilotFeedback)
    .where(
      and(
        eq(pilotFeedback.learnerId, learnerId),
        eq(pilotFeedback.lessonSessionId, sessionId),
      ),
    )
    .limit(1);
  return saved ? serialiseFeedback(saved) : null;
}

export async function savePilotFeedback(input: PilotFeedbackInput) {
  const db = getDatabase();
  const [session] = await db
    .select({ status: lessonSessions.status })
    .from(lessonSessions)
    .where(
      and(
        eq(lessonSessions.id, input.sessionId),
        eq(lessonSessions.learnerId, input.learnerId),
      ),
    )
    .limit(1);
  if (!session) throw new Error("UNKNOWN_LESSON_SESSION");
  if (session.status !== "completed") throw new Error("LESSON_SESSION_NOT_COMPLETED");

  const now = input.now ?? new Date();
  const comment = input.comment?.trim() || null;
  const appVersion = getServerEnvironment().APP_VERSION;
  const [saved] = await db
    .insert(pilotFeedback)
    .values({
      learnerId: input.learnerId,
      lessonSessionId: input.sessionId,
      overallRating: input.overallRating,
      pacing: input.pacing,
      readingTime: input.readingTime,
      microphoneCapture: input.microphoneCapture,
      comment,
      appVersion,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: pilotFeedback.lessonSessionId,
      set: {
        overallRating: input.overallRating,
        pacing: input.pacing,
        readingTime: input.readingTime,
        microphoneCapture: input.microphoneCapture,
        comment,
        appVersion,
        updatedAt: now,
      },
    })
    .returning();

  return serialiseFeedback(saved);
}
