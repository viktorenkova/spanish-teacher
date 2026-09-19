export type PhraseRehearsalAssessment = {
  status: "matched" | "close" | "retry";
  feedback: string;
  matchedWordCount: number;
  targetWordCount: number;
};

function normalizeWords(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-zñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function targetVariants(targetText: string) {
  return targetText
    .split(/\s+\/\s+/)
    .flatMap((part) => {
      const wordAlternative = part.match(/^(.*?)([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)(.*)$/);
      if (!wordAlternative) return [part];
      const [, before, first, second, after] = wordAlternative;
      return [`${before}${first}${after}`, `${before}${second}${after}`];
    })
    .map(normalizeWords)
    .filter((words) => words.length > 0);
}

function orderedWordMatches(target: string[], transcript: string[]) {
  let transcriptIndex = 0;
  let matched = 0;

  for (const targetWord of target) {
    while (transcriptIndex < transcript.length && transcript[transcriptIndex] !== targetWord) {
      transcriptIndex += 1;
    }
    if (transcriptIndex >= transcript.length) break;
    matched += 1;
    transcriptIndex += 1;
  }

  return matched;
}

export function assessPhraseRehearsal(
  targetText: string,
  transcriptText: string,
): PhraseRehearsalAssessment {
  const transcriptWords = normalizeWords(transcriptText);
  const variants = targetVariants(targetText);
  const best = variants
    .map((targetWords) => ({
      targetWordCount: targetWords.length,
      matchedWordCount: orderedWordMatches(targetWords, transcriptWords),
    }))
    .sort((left, right) => {
      const leftCoverage = left.matchedWordCount / left.targetWordCount;
      const rightCoverage = right.matchedWordCount / right.targetWordCount;
      return rightCoverage - leftCoverage || right.matchedWordCount - left.matchedWordCount;
    })[0] ?? { targetWordCount: 0, matchedWordCount: 0 };

  const coverage = best.targetWordCount > 0
    ? best.matchedWordCount / best.targetWordCount
    : 0;

  if (best.targetWordCount > 0 && coverage === 1) {
    return {
      status: "matched",
      feedback: "The browser heard the key words in this phrase. Pronunciation was not assessed.",
      ...best,
    };
  }

  if (coverage >= 0.6) {
    return {
      status: "close",
      feedback: "The browser heard some key words. Compare the transcript and try the whole phrase again. Pronunciation was not assessed.",
      ...best,
    };
  }

  return {
    status: "retry",
    feedback: "The transcript is different from this phrase. Listen once more and try again. Pronunciation was not assessed.",
    ...best,
  };
}
