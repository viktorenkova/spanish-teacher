import type { SpeechToTextProvider, SttRequest, SttTranscript } from "./provider";

type SpeechRecognitionAlternativeLike = { transcript: string; confidence: number };
type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
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
  if (code === "audio-capture") return "No working microphone was found.";
  if (code === "network") return "The browser speech service could not be reached.";
  return "The browser could not transcribe this recording.";
}

function resultsFrom(event: SpeechRecognitionEventLike) {
  return Array.from({ length: event.results.length }, (_, index) => event.results[index]);
}

export class BrowserSpeechToTextProvider implements SpeechToTextProvider {
  readonly id = "browser-speech-recognition";
  private recognition?: SpeechRecognitionLike;
  private stopRequested = false;
  private cancelActive?: () => void;
  private completeActive?: () => void;

  isSupported() {
    return typeof window !== "undefined" && Boolean(recognitionConstructor());
  }

  async transcribe(request: SttRequest): Promise<SttTranscript> {
    const Constructor = recognitionConstructor();
    if (!Constructor) throw new Error("Speech recognition is not supported in this browser.");
    if (this.recognition) throw new Error("The microphone is already listening.");

    this.stopRequested = false;

    return new Promise<SttTranscript>((resolve, reject) => {
      let settled = false;
      let completedText = "";
      let currentFinalText = "";
      let currentInterimText = "";
      let confidence: number | undefined;

      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        this.recognition = undefined;
        this.cancelActive = undefined;
        this.completeActive = undefined;
        callback();
      };

      const appendCurrentRun = (includeInterim: boolean) => {
        const currentText = (currentFinalText || (includeInterim ? currentInterimText : "")).trim();
        if (currentText) completedText = `${completedText} ${currentText}`.trim();
        currentFinalText = "";
        currentInterimText = "";
      };

      const resolveTranscript = () => {
        appendCurrentRun(true);
        if (!completedText) {
          finish(() => reject(new Error("No transcript was produced. Speak before stopping the microphone.")));
          return;
        }
        finish(() => resolve({ text: completedText, providerId: this.id, confidence }));
      };

      const timeout = window.setTimeout(() => {
        this.recognition?.abort();
        finish(() => reject(new Error("Recording reached its time limit. Start again and stop the microphone when you finish.")));
      }, request.maxDurationMs);

      this.cancelActive = () =>
        finish(() => reject(new Error("The microphone recording was cancelled.")));
      this.completeActive = resolveTranscript;

      const onResult = (event: SpeechRecognitionEventLike) => {
        const results = resultsFrom(event);
        currentFinalText = results
          .filter((result) => result?.isFinal)
          .map((result) => result?.[0]?.transcript.trim())
          .filter(Boolean)
          .join(" ");
        currentInterimText = results
          .filter((result) => result && !result.isFinal)
          .map((result) => result?.[0]?.transcript.trim())
          .filter(Boolean)
          .join(" ");
        const finalAlternative = [...results]
          .reverse()
          .find((result) => result?.isFinal)?.[0];
        if (
          finalAlternative
          && Number.isFinite(finalAlternative.confidence)
          && finalAlternative.confidence > 0
        ) {
          confidence = finalAlternative.confidence;
        }
      };
      const onError = (event: SpeechRecognitionErrorLike) => {
        if (event.error === "no-speech" && !this.stopRequested) return;
        finish(() => reject(new Error(browserErrorMessage(event.error))));
      };
      const onEnd = () => {
        if (settled) return;
        if (this.stopRequested) {
          resolveTranscript();
          return;
        }
        this.recognition = undefined;
        // Interim hypotheses are not committed across recognition sessions: the
        // next session may return the same words as a final result.
        appendCurrentRun(false);
        window.setTimeout(() => {
          if (!settled && !this.stopRequested) startRecognition();
        }, 100);
      };

      const startRecognition = () => {
        try {
          // A new instance prevents a browser from replaying the previous
          // session's cumulative result list after an automatic pause.
          const recognition = new Constructor();
          this.recognition = recognition;
          recognition.lang = request.locale;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
          recognition.onresult = onResult;
          recognition.onerror = onError;
          recognition.onnomatch = () => undefined;
          recognition.onend = onEnd;
          recognition.start();
        } catch (error) {
          finish(() => reject(error));
        }
      };

      startRecognition();
    });
  }

  stop() {
    if (!this.completeActive) return;
    this.stopRequested = true;
    if (!this.recognition) {
      this.completeActive();
      return;
    }
    try {
      this.recognition.stop();
    } catch {
      this.completeActive?.();
    }
  }

  abort() {
    const recognition = this.recognition;
    const cancel = this.cancelActive;
    this.recognition = undefined;
    this.cancelActive = undefined;
    this.completeActive = undefined;
    recognition?.abort();
    cancel?.();
  }
}
