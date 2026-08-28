export type SpeakingAssessment = {
  complete: boolean;
  matchedSignals: Array<"name" | "origin" | "get_up" | "breakfast">;
  feedback: string;
  version: "introduction-task-v1" | "morning-routine-task-v1";
};

function normalizeTranscript(transcript: string) {
  return transcript
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-zñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assessMorningRoutineTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasGetUp = /\b(me levanto|suelo levantarme)\b/.test(normalized);
  const hasBreakfast = /\b(desayuno|tomo el desayuno)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasGetUp) matchedSignals.push("get_up");
  if (hasBreakfast) matchedSignals.push("breakfast");

  if (hasGetUp && hasBreakfast) {
    return {
      complete: true,
      matchedSignals,
      feedback:
        "Task complete: the transcript includes getting up and having breakfast. Pronunciation was not assessed.",
      version: "morning-routine-task-v1",
    };
  }

  const missing = [
    !hasGetUp ? "getting up with ‘Me levanto…’" : undefined,
    !hasBreakfast ? "breakfast with ‘desayuno’" : undefined,
  ].filter(Boolean).join(" and ");
  return {
    complete: false,
    matchedSignals,
    feedback: `Try once more and include ${missing}. The transcript may also need correction.`,
    version: "morning-routine-task-v1",
  };
}

export function assessIntroductionTranscript(transcript: string): SpeakingAssessment {
  const normalized = normalizeTranscript(transcript);
  const hasName = /\b(me llamo|mi nombre es)\b/.test(normalized);
  const hasOrigin = /\b(soy de|vengo de)\b/.test(normalized);
  const matchedSignals: SpeakingAssessment["matchedSignals"] = [];
  if (hasName) matchedSignals.push("name");
  if (hasOrigin) matchedSignals.push("origin");

  if (hasName && hasOrigin) {
    return {
      complete: true,
      matchedSignals,
      feedback:
        "Task complete: the transcript includes your name and where you are from. Pronunciation was not assessed.",
      version: "introduction-task-v1",
    };
  }

  const missing = [!hasName ? "your name with ‘Me llamo…’" : undefined, !hasOrigin ? "your origin with ‘Soy de…’" : undefined]
    .filter(Boolean)
    .join(" and ");
  return {
    complete: false,
    matchedSignals,
    feedback: `Try once more and include ${missing}. The transcript may also need correction.`,
    version: "introduction-task-v1",
  };
}
