export type TtsRequest = {
  text: string;
  locale: "es-ES";
  rate: number;
};

export type TtsAudio = {
  bytes: Uint8Array;
  contentType: "audio/wav";
  providerId: string;
  voiceId: string;
};

export interface TtsProvider {
  readonly id: string;
  readonly cacheVersion: string;
  synthesize(request: TtsRequest): Promise<TtsAudio>;
}
