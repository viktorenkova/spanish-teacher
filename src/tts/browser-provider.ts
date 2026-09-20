import type { TtsRequest } from "./provider";

async function loadVoices() {
  const available = window.speechSynthesis.getVoices();
  if (available.length > 0) return available;

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 800);
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });

  return window.speechSynthesis.getVoices();
}

export async function speakWithBrowser(request: TtsRequest, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (!("speechSynthesis" in window)) {
    throw new Error("This browser does not support speech synthesis.");
  }

  const voices = await loadVoices();
  signal?.throwIfAborted();
  const voice =
    voices.find((candidate) => candidate.lang.toLowerCase() === request.locale.toLowerCase()) ??
    voices.find((candidate) => candidate.lang.toLowerCase().startsWith("es"));
  if (!voice) throw new Error("No Spanish voice is available in this browser.");

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.lang = request.locale;
    utterance.voice = voice;
    utterance.rate = request.rate;
    function cleanup() {
      signal?.removeEventListener("abort", abort);
      utterance.onend = null;
      utterance.onerror = null;
    }
    function abort() {
      cleanup();
      window.speechSynthesis.cancel();
      reject(signal?.reason ?? new DOMException("Speech stopped.", "AbortError"));
    }
    utterance.onend = () => { cleanup(); resolve(); };
    utterance.onerror = () => { cleanup(); reject(new Error("The browser could not play Spanish speech.")); };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });

  return { providerId: "browser-speech-synthesis", voiceId: voice.name };
}
