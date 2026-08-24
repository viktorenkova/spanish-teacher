export type MistakeStatus = "active" | "improving" | "resolved";
export type MistakeEvidenceKind = "observed" | "successful_evidence";

export type MistakeState = {
  occurrenceCount: number;
  successfulEvidenceCount: number;
  status: MistakeStatus;
};

export type MistakeMemoryItem = MistakeState & {
  code: string;
  category: string;
  targetPattern: string;
  explanation: string;
};

export type MistakeMemory = {
  outstandingCount: number;
  items: MistakeMemoryItem[];
};

export const evidenceNeededToResolve = 2;

export function applyMistakeEvidence(
  current: MistakeState | undefined,
  evidence: MistakeEvidenceKind,
): MistakeState | undefined {
  if (evidence === "observed") {
    return {
      occurrenceCount: (current?.occurrenceCount ?? 0) + 1,
      successfulEvidenceCount: 0,
      status: "active",
    };
  }

  if (!current) return undefined;
  const successfulEvidenceCount = current.successfulEvidenceCount + 1;
  return {
    occurrenceCount: current.occurrenceCount,
    successfulEvidenceCount,
    status: successfulEvidenceCount >= evidenceNeededToResolve ? "resolved" : "improving",
  };
}
