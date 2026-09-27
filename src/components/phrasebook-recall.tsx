"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LearnerOverview } from "@/domain/learner-overview";
import {
  assessPhraseRehearsal,
  type PhraseRehearsalAssessment,
} from "@/domain/phrase-rehearsal";
import { BrowserSpeechToTextProvider } from "@/stt/browser-provider";
import { PhraseAudioButton } from "./phrase-audio-button";
import { useUiSounds } from "./ui-sound-provider";

type Phrase = LearnerOverview["phrasebook"][number];

export function PhrasebookRecall({ learnerId, items, closeLabel = "Back to phrasebook", onClose, onReturnToToday, onSaved }: {
  learnerId: string;
  items: Phrase[];
  closeLabel?: string;
  onClose: () => void;
  onReturnToToday?: () => void;
  onSaved?: (learningItemId: string, remembered: boolean) => void;
}) {
  const [round, setRound] = useState(() => items.slice(0, 5));
  const [nextBatchStart, setNextBatchStart] = useState(Math.min(5, items.length));
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [needsHelp, setNeedsHelp] = useState<Phrase[]>([]);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const { setAudioBusy } = useUiSounds();
  const audioOwner = useId();
  const [speechError, setSpeechError] = useState<string>();
  const [speechResult, setSpeechResult] = useState<{
    transcript: string;
    assessment: PhraseRehearsalAssessment;
  }>();
  const [repairState, setRepairState] = useState<"none" | "needs-repair" | "repaired">("none");
  const heading = useRef<HTMLHeadingElement>(null);
  const answer = useRef<HTMLDivElement>(null);
  const speechProvider = useRef(new BrowserSpeechToTextProvider());
  const phrase = round[index];
  const repairWords = speechResult && speechResult.assessment.status !== "matched"
    ? speechResult.assessment.missingWords
    : [];
  const repairText = repairWords.join(" ");

  useEffect(() => { heading.current?.focus(); }, [index, round]);
  useEffect(() => { if (revealed) answer.current?.focus(); }, [revealed]);
  useEffect(() => () => speechProvider.current.abort(), []);
  useEffect(() => {
    setAudioBusy(audioOwner, recording || playingAudio);
    return () => setAudioBusy(audioOwner, false);
  }, [audioOwner, recording, playingAudio, setAudioBusy]);

  function resetSpeechPractice() {
    speechProvider.current.abort();
    setSpeechError(undefined);
    setSpeechResult(undefined);
    setRepairState("none");
    setRecording(false);
    setPlayingAudio(false);
  }

  async function practiseSpeaking() {
    if (!phrase || playingAudio) return;
    if (recording) {
      speechProvider.current.stop();
      return;
    }
    setRecording(true);
    setSpeechError(undefined);
    setSpeechResult(undefined);
    try {
      const transcript = await speechProvider.current.transcribe({ locale: "es-ES", maxDurationMs: 15_000 });
      const assessment = assessPhraseRehearsal(phrase.targetText, transcript.text);
      setSpeechResult({
        transcript: transcript.text,
        assessment,
      });
      setRepairState((current) => {
        if (assessment.status !== "matched") return "needs-repair";
        return current === "needs-repair" || current === "repaired" ? "repaired" : "none";
      });
    } catch (error) {
      setSpeechError(error instanceof Error ? error.message : "Spanish speech could not be transcribed.");
    } finally {
      setRecording(false);
    }
  }

  async function next(remembered: boolean) {
    if (!revealed || !phrase || saving) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const response = await fetch("/api/learner/phrasebook/self-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, learningItemId: phrase.id, remembered }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "The phrase check could not be saved. Try again.");
      }
      onSaved?.(phrase.id, remembered);
      resetSpeechPractice();
      setCheckedIds((current) => current.includes(phrase.id) ? current : [...current, phrase.id]);
      if (!remembered) setNeedsHelp((current) => [...current, phrase]);
      setRevealed(false);
      setIndex((current) => current + 1);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The phrase check could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="phrasebook-recall" aria-labelledby="phrasebook-recall-title">
      <h2 id="phrasebook-recall-title" ref={heading} tabIndex={-1}>
        {phrase ? `Say it from memory · ${index + 1} of ${round.length}` : "Memory practice complete"}
      </h2>
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
                <div className="phrasebook-recall-actions">
                  <button type="button" className="secondary-button" disabled={recording || saving} onClick={() => void next(true)}>I remembered it</button>
                  <button type="button" className="secondary-button" disabled={recording || saving} onClick={() => void next(false)}>I needed help</button>
                </div>
                <details className="phrasebook-extra-practice">
                  <summary>Optional listening and speaking practice</summary>
                <PhraseAudioButton
                  key={phrase.id}
                  text={repairText || phrase.targetText}
                  disabled={recording}
                  idleLabel={repairText ? "Listen to focus words" : "Listen to the answer"}
                  onPlaybackChange={setPlayingAudio}
                />
                <button
                  type="button"
                  className="phrasebook-speak"
                  data-ui-sound="off"
                  disabled={playingAudio}
                  onClick={() => void practiseSpeaking()}
                >
                  {recording
                    ? "■ Stop and check"
                    : speechResult
                      ? speechResult.assessment.status === "matched"
                        ? "● Say it again"
                        : "● Try speaking again"
                      : "● Say it and check"}
                </button>
                {recording && (
                  <p className="phrasebook-recording" role="status">Listening… Say the whole phrase, then stop the microphone.</p>
                )}
                {speechResult && (
                  <div className={`phrasebook-transcript ${speechResult.assessment.status}`} aria-live="polite">
                    <small>The browser heard</small>
                    <p lang="es">{speechResult.transcript}</p>
                    <span>{speechResult.assessment.feedback}</span>
                  </div>
                )}
                {speechResult?.assessment.status === "matched" && repairState === "repaired" && (
                  <p className="phrasebook-repair-success" role="status">
                    Nice repair. You completed the full phrase after focusing on the missing words.
                  </p>
                )}
                {repairWords.length > 0 && (
                  <div className="phrasebook-repair-guide">
                    <strong>Focus words</strong>
                    <p lang="es">{repairWords.join(" · ")}</p>
                    <span>Listen to these words, then say the whole phrase again.</span>
                  </div>
                )}
                {speechError && <p className="phrasebook-audio-error" role="alert">{speechError}</p>}
                <p>Listen, then say the phrase again.</p>
                <p>Compare your words. Another Spanish answer may also be correct. For a phrase with …, add your own details.</p>
                </details>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <p>You marked {round.length - needsHelp.length} of {round.length} phrases as remembered in this round.</p>
          <p>You checked {checkedIds.length} of {items.length} phrases in this practice.</p>
          <p>{needsHelp.length
            ? "Try the phrases you needed help with once more. You can also take a break."
            : nextBatchStart < items.length
              ? "You can try the next phrases or take a break."
              : "You have checked all the phrases in this set. Come back later to try again."}</p>
          {needsHelp.length > 0 && (
            <button type="button" className="secondary-button" onClick={() => {
              resetSpeechPractice();
              setRound(needsHelp);
              setNeedsHelp([]);
              setIndex(0);
              setRevealed(false);
            }}>Try difficult phrases again</button>
          )}
          {nextBatchStart < items.length && (
            <button type="button" className="secondary-button" onClick={() => {
              resetSpeechPractice();
              setRound(items.slice(nextBatchStart, nextBatchStart + 5));
              setNextBatchStart((current) => Math.min(current + 5, items.length));
              setNeedsHelp([]);
              setIndex(0);
              setRevealed(false);
            }}>{items.length - nextBatchStart === 1 ? "Practise next phrase" : `Practise next ${Math.min(5, items.length - nextBatchStart)} phrases`}</button>
          )}
          {onReturnToToday && (
            <button type="button" className="primary-button" onClick={onReturnToToday}>
              Return to Today
            </button>
          )}
        </>
      )}
      {saving && <p role="status">Saving your check…</p>}
      {saveError && <p className="feedback retry" role="alert">{saveError}</p>}
      <small>Your self-check is saved to schedule review. It is not a speaking or pronunciation score.</small>
      <button type="button" className="text-button" disabled={saving} onClick={onClose}>{closeLabel}</button>
    </section>
  );
}
