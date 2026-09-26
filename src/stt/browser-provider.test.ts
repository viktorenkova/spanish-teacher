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

  it("does not commit an interim hypothesis that is finalised after a browser pause", async () => {
    const recognitions: FakeRecognition[] = [];
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 0;
      onresult: ((event: { results: Array<{ 0: { transcript: string; confidence: number }; isFinal: boolean }> }) => void) | null = null;
      onerror = null;
      onnomatch = null;
      onend: (() => void) | null = null;
      constructor() { recognitions.push(this); }
      start() {}
      stop() { queueMicrotask(() => this.onend?.()); }
      abort() {}
    }
    vi.stubGlobal("window", { SpeechRecognition: FakeRecognition, setTimeout, clearTimeout });
    const provider = new BrowserSpeechToTextProvider();
    const transcript = provider.transcribe({ locale: "es-ES", maxDurationMs: 1_000 });
    const first = recognitions[0];
    first.onresult?.({ results: [{ 0: { transcript: "Me levanto.", confidence: 0 }, isFinal: false }] });
    first.onend?.();
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(recognitions).toHaveLength(2);
    recognitions[1].onresult?.({ results: [{ 0: { transcript: "Me levanto.", confidence: 0.9 }, isFinal: true }] });
    provider.stop();
    await expect(transcript).resolves.toMatchObject({ text: "Me levanto." });
  });

  it("uses the latest cumulative result list rather than appending every interim event", async () => {
    const recognitions: FakeRecognition[] = [];
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 0;
      onresult: ((event: { results: Array<{ 0: { transcript: string; confidence: number }; isFinal: boolean }> }) => void) | null = null;
      onerror = null;
      onnomatch = null;
      onend: (() => void) | null = null;
      constructor() { recognitions.push(this); }
      start() {}
      stop() { queueMicrotask(() => this.onend?.()); }
      abort() {}
    }
    vi.stubGlobal("window", { SpeechRecognition: FakeRecognition, setTimeout, clearTimeout });
    const provider = new BrowserSpeechToTextProvider();
    const transcript = provider.transcribe({ locale: "es-ES", maxDurationMs: 1_000 });
    const recognition = recognitions[0];
    recognition.onresult?.({ results: [{ 0: { transcript: "Me", confidence: 0 }, isFinal: false }] });
    recognition.onresult?.({ results: [{ 0: { transcript: "Me levanto.", confidence: 0.9 }, isFinal: true }] });
    provider.stop();
    await expect(transcript).resolves.toMatchObject({ text: "Me levanto." });
  });
});
