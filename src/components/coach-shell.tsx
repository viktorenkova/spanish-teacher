"use client";

import { useEffect, useState } from "react";
import { CoachExperience, type CoachMode } from "./coach-experience";
import { PwaInstallButton } from "./pwa-install-button";
import { useUiSounds } from "./ui-sound-provider";

export function CoachShell() {
  const [mode, setMode] = useState<CoachMode>("welcome");
  const showHero = mode === "welcome";
  const sounds = useUiSounds();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [mode]);

  return (
    <main
      id="top"
      className={showHero ? "welcome-mode" : `app-mode ${mode}-mode`}
      onClickCapture={(event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const button = target.closest("button");
        if (button && !button.disabled && !button.closest('[data-ui-sound="off"]')) sounds.play("tap");
      }}
    >
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Spanish Coach home">
          <span className="brand-mark" aria-hidden="true">¡</span>
          <span className="brand-name">Hola<span>.</span></span>
          <small>Spanish coach</small>
        </a>
        <div className="header-actions">
          <PwaInstallButton />
          <button
            className="sound-toggle"
            data-ui-sound="off"
            type="button"
            aria-label={sounds.enabled ? "Turn interface sounds off" : "Turn interface sounds on"}
            aria-pressed={sounds.enabled}
            title={sounds.enabled ? "Interface sounds on" : "Interface sounds off"}
            onClick={sounds.toggle}
          >
            <span aria-hidden="true">♪</span>
          </button>
          <div className="level-chip" aria-label="Spanish level A1, English support B1">
            <span>ES</span> A1 <i /> <span>EN</span> B1
          </div>
        </div>
      </header>

      {showHero && (
        <div className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Spanish, one useful step at a time</span>
            <h1>Learn Spanish that feels good to use.</h1>
            <p>
              Short, calm practice for real conversations — with clear English support whenever you need it.
            </p>
            <ul className="lesson-meta" aria-label="Lesson details">
              <li><span aria-hidden="true">◷</span> About 5–8 minutes per core lesson</li>
              <li><span aria-hidden="true">✦</span> Spain Spanish</li>
              <li><span aria-hidden="true">◌</span> Speak from day one</li>
            </ul>
          </div>
          <aside className="coach-note" aria-label="Today’s practice preview">
            <div className="sun" aria-hidden="true">☼</div>
            <div className="speech-bubble" lang="es">¡Hola!</div>
            <div className="cactus" aria-hidden="true"><i /><i /><i /></div>
            <p><strong>Today’s practice</strong>Your next useful step is chosen from your progress.</p>
          </aside>
        </div>
      )}

      <CoachExperience onModeChange={setMode} />
    </main>
  );
}
