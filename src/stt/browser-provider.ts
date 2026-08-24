import type { SpeechToTextProvider, SttRequest, SttTranscript } from "./provider";

type SpeechRecognitionAlternativeLike = { transcript: string; confidence: number };
type SpeechRecognitionEventLike = {
  results: ArrayLike<{ 0: SpeechRecognitionAlternativeLike; isFinal: boolean }>;
};
type SpeechRecognitionErrorLike = { error: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onnomatch: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor() {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function browserErrorMessage(code: string) {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Microphone access was not allowed. Enable it in your browser and try again.";
  }
  if (code === "no-speech") return "No speech was detected. Try again in a quieter place.";
  if (code === "audio-capture") return "No working microphone was found.";
  if (code === "network") return "The browser speech service could not be reached.";
  return "The browser could not transcribe this recording.";
}

export class BrowserSpeechToTextProvider implements SpeechToTextProvider {
  readonly id = "browser-speech-recognition";
  private recognition?: SpeechRecognitionLike;

  isSupported() {
    return typeof window !== "undefined" && Boolean(recognitionConstructor());
  }

  async transcribe(request: SttRequest): Promise<SttTranscript> {
    const Constructor = recognitionConstructor();
    if (!Constructor) throw new Error("Speech recognition is not supported in this browser.");
    if (this.recognition) throw new Error("The microphone is already listening.");

    const recognition = new Constructor();
    this.recognition = recognition;
    recognition.lang = request.locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    return new Promise<SttTranscript>((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        this.recognition = undefined;
        callback();
      };
      const timeout = window.setTimeout(() => recognition.stop(), request.maxDurationMs);

      recognition.onresult = (event) => {
        const alternative = event.results[0]?.[0];
        const text = alternative?.transcript.trim();
        if (!text) return;
        finish(() =>
          resolve({
            text,
            providerId: this.id,
            confidence:
              Number.isFinite(alternative.confidence) && alternative.confidence > 0
                ? alternative.confidence
                : undefined,
          }),
        );
        recognition.stop();
      };
      recognition.onerror = (event) => finish(() => reject(new Error(browserErrorMessage(event.error))));
      recognition.onnomatch = () => finish(() => reject(new Error("No clear Spanish speech was recognised.")));
      recognition.onend = () =>
        finish(() => reject(new Error("No transcript was produced. Speak after the microphone starts.")));

      try {
        recognition.start();
      } catch (error) {
        finish(() => reject(error));
      }
    });
  }

  stop() {
    this.recognition?.stop();
  }

  abort() {
    this.recognition?.abort();
    this.recognition = undefined;
  }
}
