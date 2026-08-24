import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserSpeechToTextProvider } from "./browser-provider";

describe("browser speech-to-text provider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requests es-ES and returns the browser transcript", async () => {
    let recognition: FakeRecognition | undefined;
    class FakeRecognition {
      lang = "";
      continuous = true;
      interimResults = true;
      maxAlternatives = 0;
      onresult?: (event: {
        results: Array<{ 0: { transcript: string; confidence: number }; isFinal: boolean }>;
      }) => void;
      onerror?: (event: { error: string }) => void;
      onnomatch?: () => void;
      onend?: () => void;

      constructor() {
        recognition = this;
      }

      start() {
        queueMicrotask(() =>
          this.onresult?.({
            results: [{ 0: { transcript: "Me llamo Katia", confidence: 0.82 }, isFinal: true }],
          }),
        );
      }

      stop() {}
      abort() {}
    }

    vi.stubGlobal("window", {
      SpeechRecognition: FakeRecognition,
      setTimeout,
      clearTimeout,
    });

    const provider = new BrowserSpeechToTextProvider();
    const result = await provider.transcribe({ locale: "es-ES", maxDurationMs: 1_000 });

    expect(recognition?.lang).toBe("es-ES");
    expect(recognition?.continuous).toBe(false);
    expect(result).toEqual({
      text: "Me llamo Katia",
      providerId: "browser-speech-recognition",
      confidence: 0.82,
    });
  });
});
