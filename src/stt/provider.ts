export type SttRequest = {
  locale: "es-ES";
  maxDurationMs: number;
};

export type SttTranscript = {
  text: string;
  providerId: string;
  confidence?: number;
};

export interface SpeechToTextProvider {
  readonly id: string;
  isSupported(): boolean;
  transcribe(request: SttRequest): Promise<SttTranscript>;
  stop(): void;
  abort(): void;
}
