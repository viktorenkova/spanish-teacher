import { afterEach, expect, it, vi } from "vitest";
import { speakWithBrowser } from "./browser-provider";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

function setup(voices = [{ lang: "es-ES", name: "Spanish" }]) {
  const speech = Object.assign(new EventTarget(), {
    getVoices: vi.fn(() => voices),
    speak: vi.fn(),
    cancel: vi.fn(),
  });
  vi.stubGlobal("window", { speechSynthesis: speech, setTimeout, clearTimeout });
  vi.stubGlobal("SpeechSynthesisUtterance", class {
    constructor(public text: string) {}
  });
  return speech;
}

it("does not start audio after cancellation while waiting for voices", async () => {
  vi.useFakeTimers();
  const speech = setup([]);
  const controller = new AbortController();
  const result = speakWithBrowser({ text: "Hola", locale: "es-ES", rate: 0.86 }, controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await vi.advanceTimersByTimeAsync(800);
  await rejected;
  expect(speech.speak).not.toHaveBeenCalled();
});

it("stops active speech and settles even when the browser sends no cancellation event", async () => {
  const speech = setup();
  const controller = new AbortController();
  const result = speakWithBrowser({ text: "Hola", locale: "es-ES", rate: 0.86 }, controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  await Promise.resolve();
  expect(speech.speak).toHaveBeenCalledOnce();
  speech.cancel.mockClear();
  controller.abort();
  await rejected;
  expect(speech.cancel).toHaveBeenCalledOnce();
});

it("removes the abort handler when playback finishes", async () => {
  const speech = setup();
  const controller = new AbortController();
  const result = speakWithBrowser({ text: "Hola", locale: "es-ES", rate: 0.86 }, controller.signal);
  await Promise.resolve();
  const utterance = speech.speak.mock.calls[0][0];
  expect(utterance).toMatchObject({ text: "Hola", lang: "es-ES", rate: 0.86 });
  utterance.onend();
  await expect(result).resolves.toMatchObject({ providerId: "browser-speech-synthesis" });
  speech.cancel.mockClear();
  controller.abort();
  expect(speech.cancel).not.toHaveBeenCalled();
});
