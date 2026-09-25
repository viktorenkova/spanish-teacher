"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore } from "react";

type Cue = "tap" | "correct" | "retry";
type UiSoundContextValue = {
  enabled: boolean;
  toggle: () => void;
  play: (cue: Cue) => void;
  setAudioBusy: (owner: string, busy: boolean) => void;
};

const storageKey = "spanish-coach-ui-sounds";
const changeEvent = "spanish-coach-ui-sounds-change";
let fallbackEnabled = true;
const UiSoundContext = createContext<UiSoundContextValue | null>(null);

function getEnabled() {
  try { return window.localStorage.getItem(storageKey) !== "off"; }
  catch { return fallbackEnabled; }
}

function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function UiSoundProvider({ children }: { children: React.ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, getEnabled, () => true);
  const contextRef = useRef<AudioContext | null>(null);
  const audioBusy = useRef(new Set<string>());

  useEffect(() => {
    return () => {
      const audio = contextRef.current;
      contextRef.current = null;
      void audio?.close();
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !getEnabled();
    fallbackEnabled = next;
    try { window.localStorage.setItem(storageKey, next ? "on" : "off"); } catch { /* Storage is optional. */ }
    window.dispatchEvent(new Event(changeEvent));
  }, []);

  const play = useCallback((cue: Cue) => {
    if (!enabled || audioBusy.current.size > 0 || typeof window === "undefined" || !window.AudioContext) return;
    try {
      const audio = contextRef.current ?? new window.AudioContext();
      contextRef.current = audio;
      if (audio.state === "suspended") void audio.resume().catch(() => {});
      const now = audio.currentTime;
      const notes = cue === "correct" ? [523, 659] : cue === "retry" ? [392, 349] : [520];
      notes.forEach((frequency, index) => {
        const start = now + index * (cue === "tap" ? 0 : 0.09);
        const duration = cue === "tap" ? 0.045 : 0.13;
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        volume.gain.setValueAtTime(0.0001, start);
        volume.gain.exponentialRampToValueAtTime(cue === "tap" ? 0.025 : 0.045, start + 0.012);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(volume);
        volume.connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
      });
    } catch {
      // Sound is supplementary; never block a lesson when audio is unavailable.
    }
  }, [enabled]);

  const setAudioBusy = useCallback((owner: string, busy: boolean) => {
    if (busy) audioBusy.current.add(owner);
    else audioBusy.current.delete(owner);
  }, []);

  return (
    <UiSoundContext.Provider value={{ enabled, toggle, play, setAudioBusy }}>
      {children}
    </UiSoundContext.Provider>
  );
}

export function useUiSounds() {
  const context = useContext(UiSoundContext);
  if (!context) throw new Error("UI sounds must be used within UiSoundProvider");
  return context;
}
