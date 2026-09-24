export type JourneyChoice = "next_lesson" | "review";

export function isRecentCompletion(completedAt: string) {
  const elapsedMs = Date.now() - Date.parse(completedAt);
  return elapsedMs >= 0 && elapsedMs <= 30 * 60 * 1000;
}

export function recentCompletionContext(learnerId: string, sessionId: string) {
  return { learnerId, sessionId, recordedAt: new Date().toISOString() };
}

export async function recordJourneyChoice(input: {
  learnerId: string;
  sessionId: string;
  choice: JourneyChoice;
}) {
  try {
    await fetch("/api/learning-journey/choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      keepalive: true,
    });
  } catch {
    // Measurement must not interrupt a lesson transition.
  }
}
