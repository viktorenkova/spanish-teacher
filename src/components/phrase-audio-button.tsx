"use client";

import { useEffect, useRef, useState } from "react";
import { speakWithBrowser } from "@/tts/browser-provider";

export function PhraseAudioButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string>();
  const playback = useRef<AbortController | null>(null);

  useEffect(() => () => playback.current?.abort(), []);

  async function play() {
    if (playback.current) {
      playback.current.abort();
      playback.current = null;
      setPlaying(false);
      return;
    }
    const controller = new AbortController();
    playback.current = controller;
    setPlaying(true);
    setError(undefined);
    try {
      await speakWithBrowser({ text, locale: "es-ES", rate: 0.86 }, controller.signal);
    } catch (audioError) {
      if (!controller.signal.aborted) {
        setError(audioError instanceof Error ? audioError.message : "Spanish audio could not be played.");
      }
    } finally {
      if (playback.current === controller && !controller.signal.aborted) {
        playback.current = null;
        setPlaying(false);
      }
    }
  }

  return (
    <div>
      <button type="button" className="secondary-button" onClick={() => void play()}>
        {playing ? "Stop audio" : "Listen to the answer"}
      </button>
      {playing && <span aria-live="polite" className="phrase-audio-status">Speaking Spanish…</span>}
      {error && <p role="alert">{error} You can still read the answer and continue.</p>}
    </div>
  );
}
