"use client";

import { useEffect, useRef, useState } from "react";
import { speakWithBrowser } from "@/tts/browser-provider";

export function PhraseAudioButton({
  text,
  disabled = false,
  onPlaybackChange,
}: {
  text: string;
  disabled?: boolean;
  onPlaybackChange?: (playing: boolean) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string>();
  const [rate, setRate] = useState(0.86);
  const playback = useRef<AbortController | null>(null);

  useEffect(() => () => playback.current?.abort(), []);

  async function play() {
    if (playback.current) {
      playback.current.abort();
      playback.current = null;
      setPlaying(false);
      onPlaybackChange?.(false);
      return;
    }
    const controller = new AbortController();
    playback.current = controller;
    setPlaying(true);
    onPlaybackChange?.(true);
    setError(undefined);
    try {
      await speakWithBrowser({ text, locale: "es-ES", rate }, controller.signal);
    } catch (audioError) {
      if (!controller.signal.aborted) {
        setError(audioError instanceof Error ? audioError.message : "Spanish audio could not be played.");
      }
    } finally {
      if (playback.current === controller && !controller.signal.aborted) {
        playback.current = null;
        setPlaying(false);
        onPlaybackChange?.(false);
      }
    }
  }

  return (
    <div>
      <label>
        <span>Speed </span>
        <select value={rate} onChange={(event) => setRate(Number(event.target.value))} disabled={playing || disabled}>
          <option value={0.7}>Slow</option>
          <option value={0.86}>Normal</option>
          <option value={1}>Fast</option>
        </select>
      </label>
      <button type="button" className="secondary-button" disabled={disabled} onClick={() => void play()}>
        {playing ? "Stop audio" : "Listen to the answer"}
      </button>
      {playing && <span aria-live="polite" className="phrase-audio-status">Speaking Spanish…</span>}
      {error && <p role="alert">{error} You can still read the answer and continue.</p>}
    </div>
  );
}
