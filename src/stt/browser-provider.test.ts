import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserSpeechToTextProvider } from "./browser-provider";

describe("browser speech-to-text provider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps listening and returns the complete es-ES transcript only after manual stop", async () => {
    const recognitions: FakeRecognition[] = [];
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 0;
      onresult?: (event: {
        results: Array<{ 0: { transcript: string; confidence: number }; isFinal: boolean }>;
      }) => void;
      onerror?: (event: { error: string }) => void;
      onnomatch?: () => void;
      onend?: () => void;

      constructor() {
        recognitions.push(this);
      }

      start() {
        queueMicrotask(() =>
          this.onresult?.({
            results: [
              { 0: { transcript: "Me llamo Katia.", confidence: 0.82 }, isFinal: true },
              { 0: { transcript: "Soy de Madrid.", confidence: 0.91 }, isFinal: true },
            ],
          }),
        );
      }

      stop() {
        queueMicrotask(() => this.onend?.());
      }

      abort() {}
    }

    vi.stubGlobal("window", {
      SpeechRecognition: FakeRecognition,
      setTimeout,
      clearTimeout,
    });

    const provider = new BrowserSpeechToTextProvider();
    let resolved = false;
    const transcript = provider
      .transcribe({ locale: "es-ES", maxDurationMs: 1_000 })
      .then((result) => {
        resolved = true;
        return result;
      });

    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(recognitions[0]?.lang).toBe("es-ES");
    expect(recognitions[0]?.continuous).toBe(true);
    expect(recognitions[0]?.interimResults).toBe(true);
    expect(resolved).toBe(false);

    provider.stop();

    await expect(transcript).resolves.toEqual({
      text: "Me llamo Katia. Soy de Madrid.",
      providerId: "browser-speech-recognition",
      confidence: 0.91,
    });
  });

  it("does not create a transcript when the learner stops before speaking", async () => {
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 0;
      onresult = null;
      onerror = null;
      onnomatch = null;
      onend: (() => void) | null = null;
      start() {}
      stop() { queueMicrotask(() => this.onend?.()); }
      abort() {}
    }

    vi.stubGlobal("window", {
      SpeechRecognition: FakeRecognition,
      setTimeout,
      clearTimeout,
    });

    const provider = new BrowserSpeechToTextProvider();
    const transcript = provider.transcribe({ locale: "es-ES", maxDurationMs: 1_000 });
    provider.stop();

    await expect(transcript).rejects.toThrow("Speak before stopping");
  });
});
