import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { buildPracticeRhythm } from "@/domain/practice-rhythm";
import { getDatabase } from "@/server/db/client";
import { lessonSessions } from "@/server/db/schema";

export async function loadPracticeRhythm(input: {
  learnerId: string;
  timezoneOffsetMinutes: number;
  now?: Date;
}) {
  const sessions = await getDatabase()
    .select({ completedAt: lessonSessions.completedAt })
    .from(lessonSessions)
    .where(and(
      eq(lessonSessions.learnerId, input.learnerId),
      eq(lessonSessions.status, "completed"),
    ))
    .orderBy(desc(lessonSessions.completedAt))
    .limit(365);

  return buildPracticeRhythm({
    completedAt: sessions.flatMap(({ completedAt }) => completedAt ? [completedAt] : []),
    now: input.now ?? new Date(),
    timezoneOffsetMinutes: input.timezoneOffsetMinutes,
  });
}
