import { getLessonDefinition, type LessonKey } from "./lesson";

export type LessonHistoryAttempt = {
  correct: boolean;
  modality: "recognition" | "recall" | "listening" | "production";
};

export type LessonHistoryEvidence = {
  id: string;
  lessonKey: LessonKey;
  startedAt: Date;
  completedAt: Date;
  attempts: LessonHistoryAttempt[];
};

export type LessonHistoryEntry = {
  sessionId: string;
  lessonKey: LessonKey;
  lessonTitle: string;
  completedAt: string;
  durationMinutes: number;
  attemptCount: number;
  correctCount: number;
  accuracyPercent: number;
  speakingCompleted: boolean;
  accuracyChange?: number;
  changeSummary: string;
};

function describeChange(
  current: Omit<LessonHistoryEntry, "changeSummary">,
  previous?: LessonHistoryEntry,
) {
  if (!previous) return "Your first completed lesson is now saved.";
  if (current.lessonKey !== previous.lessonKey) {
    return `You moved from ${previous.lessonTitle.toLowerCase()} to ${current.lessonTitle.toLowerCase()}.`;
  }

  const accuracyChange = current.accuracyPercent - previous.accuracyPercent;
  if (accuracyChange >= 5) {
    return `Accuracy improved by ${accuracyChange} percentage points.`;
  }
  if (accuracyChange <= -5) {
    return "This lesson showed where a little more review will help next time.";
  }
  if (current.speakingCompleted && !previous.speakingCompleted) {
    return "Speaking practice was completed in this lesson.";
  }
  return "Your result stayed steady while you added more practice.";
}

export function buildLessonHistory(evidence: LessonHistoryEvidence[]): LessonHistoryEntry[] {
  const chronological = [...evidence].sort(
    (left, right) => left.completedAt.getTime() - right.completedAt.getTime(),
  );
  const entries: LessonHistoryEntry[] = [];

  for (const session of chronological) {
    const lesson = getLessonDefinition(session.lessonKey);
    if (!lesson) continue;
    const attemptCount = session.attempts.length;
    const correctCount = session.attempts.filter(({ correct }) => correct).length;
    const accuracyPercent = attemptCount === 0 ? 0 : Math.round((correctCount / attemptCount) * 100);
    const previous = entries.at(-1);
    const entryWithoutSummary = {
      sessionId: session.id,
      lessonKey: session.lessonKey,
      lessonTitle: lesson.title,
      completedAt: session.completedAt.toISOString(),
      durationMinutes: Math.max(
        1,
        Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 60_000),
      ),
      attemptCount,
      correctCount,
      accuracyPercent,
      speakingCompleted: session.attempts.some(
        ({ correct, modality }) => correct && modality === "production",
      ),
      ...(previous ? { accuracyChange: accuracyPercent - previous.accuracyPercent } : {}),
    };
    entries.push({
      ...entryWithoutSummary,
      changeSummary: describeChange(entryWithoutSummary, previous),
    });
  }

  return entries.reverse();
}
