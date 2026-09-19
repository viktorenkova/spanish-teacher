"use client";

import { useEffect, useRef, useState } from "react";
import type { LearnerOverview } from "@/domain/learner-overview";

type Phrase = LearnerOverview["phrasebook"][number];

export function PhrasebookRecall({ items, onClose }: {
  items: Phrase[];
  onClose: () => void;
}) {
  const [round, setRound] = useState(items);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [needsHelp, setNeedsHelp] = useState<Phrase[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const answer = useRef<HTMLDivElement>(null);
  const phrase = round[index];

  useEffect(() => { heading.current?.focus(); }, [index, round]);
  useEffect(() => { if (revealed) answer.current?.focus(); }, [revealed]);

  function next(remembered: boolean) {
    if (!revealed || !phrase) return;
    if (!remembered) setNeedsHelp((current) => [...current, phrase]);
    setRevealed(false);
    setIndex((current) => current + 1);
  }

  return (
    <section className="phrasebook-recall" aria-labelledby="phrasebook-recall-title">
      <h4 id="phrasebook-recall-title" ref={heading} tabIndex={-1}>
        {phrase ? `Say it from memory · ${index + 1} of ${round.length}` : "Memory practice complete"}
      </h4>
      {phrase ? (
        <>
          <p>Read the English. Try saying the Spanish aloud before you look.</p>
          <strong>{phrase.supportText}</strong>
          {!revealed ? (
            <button type="button" className="secondary-button" onClick={() => setRevealed(true)}>
              Reveal Spanish
            </button>
          ) : (
            <>
              <div className="phrasebook-recall-answer" ref={answer} tabIndex={-1}>
                <strong lang="es">{phrase.targetText}</strong>
                <p>Compare your words. Another Spanish answer may also be correct. For a phrase with …, add your own details.</p>
              </div>
              <div className="phrasebook-recall-actions">
                <button type="button" className="secondary-button" onClick={() => next(true)}>I remembered it</button>
                <button type="button" className="secondary-button" onClick={() => next(false)}>I needed help</button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <p>You marked {round.length - needsHelp.length} of {round.length} phrases as remembered in this round.</p>
          <p>{needsHelp.length ? "Try the phrases you needed help with once more." : "You have finished this short practice. Come back later to try again."}</p>
          {needsHelp.length > 0 && (
            <button type="button" className="secondary-button" onClick={() => {
              setRound(needsHelp);
              setNeedsHelp([]);
              setIndex(0);
              setRevealed(false);
            }}>Try difficult phrases again</button>
          )}
        </>
      )}
      <small>This is a self-check. Nothing is recorded or saved, and your scheduled reviews stay the same.</small>
      <button type="button" className="text-button" onClick={onClose}>Back to phrasebook</button>
    </section>
  );
}
