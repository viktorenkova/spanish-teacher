export const pilotFeedbackPacingOptions = ["too_fast", "comfortable", "too_slow"] as const;
export const pilotFeedbackReadingTimeOptions = ["too_short", "almost_enough", "enough"] as const;
export const pilotFeedbackMicrophoneOptions = ["complete", "partial", "missed", "not_used"] as const;

export type PilotFeedbackPacing = typeof pilotFeedbackPacingOptions[number];
export type PilotFeedbackReadingTime = typeof pilotFeedbackReadingTimeOptions[number];
export type PilotFeedbackMicrophone = typeof pilotFeedbackMicrophoneOptions[number];

export type PilotFeedback = {
  id: string;
  learnerId: string;
  sessionId: string;
  overallRating: number;
  pacing: PilotFeedbackPacing;
  readingTime: PilotFeedbackReadingTime;
  microphoneCapture: PilotFeedbackMicrophone;
  comment?: string;
  appVersion: string;
  createdAt: string;
  updatedAt: string;
};
