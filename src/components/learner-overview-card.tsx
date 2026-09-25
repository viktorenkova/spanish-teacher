"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import type { LearnerOverview } from "@/domain/learner-overview";
import { filterPhrasebook } from "@/domain/phrasebook-search";
import {
  assessPhraseRehearsal,
  type PhraseRehearsalAssessment,
} from "@/domain/phrase-rehearsal";
import {
  learnerPrimaryGoalLabels,
  learnerPrimaryGoals,
  type LearnerPrimaryGoal,
} from "@/domain/learner-profile";
import {
  supportedSessionDurations,
  type SessionDuration,
} from "@/domain/lesson-planner";
import { BrowserSpeechToTextProvider } from "@/stt/browser-provider";
import { speakWithBrowser } from "@/tts/browser-provider";
import { useUiSounds } from "./ui-sound-provider";

export function LearnerOverviewCard({
  overview,
  view,
  showProfile = true,
  onStartReview,
  onChangeLearner,
  onDeleteLearner,
  onRenameLearner,
  onUpdatePreferences,
}: {
  overview: LearnerOverview;
  view: "profile" | "review" | "progress";
  showProfile?: boolean;
  onStartReview?: (items: LearnerOverview["phrasebook"]) => void;
  onChangeLearner: () => void;
  onDeleteLearner: (confirmationDisplayName: string) => Promise<void>;
  onRenameLearner: (displayName: string) => Promise<void>;
  onUpdatePreferences: (preferences: {
    primaryGoal: LearnerPrimaryGoal;
    preferredSessionMinutes: SessionDuration;
  }) => Promise<void>;
}) {
  const [managing, setManaging] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [displayName, setDisplayName] = useState(overview.learner.displayName);
  const [primaryGoal, setPrimaryGoal] = useState(overview.learner.primaryGoal);
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState(
    overview.learner.preferredSessionMinutes,
  );
  const [confirmationName, setConfirmationName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [playingPhraseId, setPlayingPhraseId] = useState<string>();
  const [phraseAudioError, setPhraseAudioError] = useState<string>();
  const [phraseQuery, setPhraseQuery] = useState("");
  const [recordingPhraseId, setRecordingPhraseId] = useState<string>();
  const [phraseSpeechError, setPhraseSpeechError] = useState<string>();
  const [phraseSpeechResults, setPhraseSpeechResults] = useState<Record<string, {
    itemId: string;
    transcript: string;
    assessment: PhraseRehearsalAssessment;
  }>>({});
  const [phraseRepairState, setPhraseRepairState] = useState<Record<string, "needs-repair" | "repaired">>({});
  const [spokenPhraseIds, setSpokenPhraseIds] = useState<string[]>([]);
  const [speakingFilter, setSpeakingFilter] = useState<"all" | "repair" | "unchecked">("all");
  const phraseSpeechProvider = useRef(new BrowserSpeechToTextProvider());
  const { setAudioBusy } = useUiSounds();
  const audioOwner = useId();
  const searchedPhrases = filterPhrasebook(overview.phrasebook, phraseQuery);
  const visiblePhrases = speakingFilter === "repair"
    ? searchedPhrases.filter((item) => phraseRepairState[item.id] === "needs-repair")
    : speakingFilter === "unchecked"
      ? searchedPhrases.filter((item) => !spokenPhraseIds.includes(item.id))
      : searchedPhrases;
  const repairedPhraseCount = Object.values(phraseRepairState).filter((status) => status === "repaired").length;
  const pendingRepairCount = Object.values(phraseRepairState).filter((status) => status === "needs-repair").length;

  useEffect(() => () => phraseSpeechProvider.current.abort(), []);
  useEffect(() => {
    setAudioBusy(audioOwner, Boolean(playingPhraseId || recordingPhraseId));
    return () => setAudioBusy(audioOwner, false);
  }, [audioOwner, playingPhraseId, recordingPhraseId, setAudioBusy]);

  async function playPhrase(
    item: LearnerOverview["phrasebook"][number],
    text = item.targetText,
  ) {
    setPlayingPhraseId(item.id);
    setPhraseAudioError(undefined);
    try {
      await speakWithBrowser({
        text,
        locale: "es-ES",
        rate: 0.86,
      });
    } catch (audioError) {
      setPhraseAudioError(
        audioError instanceof Error
          ? audioError.message
          : "Spanish audio could not be played in this browser.",
      );
    } finally {
      setPlayingPhraseId((current) => current === item.id ? undefined : current);
    }
  }

  async function startPhraseRehearsal(item: LearnerOverview["phrasebook"][number]) {
    if (recordingPhraseId) return;
    window.speechSynthesis?.cancel();
    setRecordingPhraseId(item.id);
    setPhraseSpeechError(undefined);
    setPhraseSpeechResults((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    try {
      const transcript = await phraseSpeechProvider.current.transcribe({
        locale: "es-ES",
        maxDurationMs: 15_000,
      });
      const assessment = assessPhraseRehearsal(item.targetText, transcript.text);
      const resolvesLastPendingRepair = assessment.status === "matched"
        && phraseRepairState[item.id] === "needs-repair"
        && pendingRepairCount === 1;
      const completesUncheckedSet = !spokenPhraseIds.includes(item.id)
        && spokenPhraseIds.length + 1 === overview.phrasebook.length;
      setPhraseSpeechResults((current) => ({
        ...current,
        [item.id]: {
          itemId: item.id,
          transcript: transcript.text,
          assessment,
        },
      }));
      setSpokenPhraseIds((current) => current.includes(item.id) ? current : [...current, item.id]);
      setPhraseRepairState((current) => {
        const next = { ...current };
        if (assessment.status === "matched") {
          if (current[item.id] === "needs-repair") next[item.id] = "repaired";
          else if (current[item.id] !== "repaired") delete next[item.id];
        } else {
          next[item.id] = "needs-repair";
        }
        return next;
      });
      if (resolvesLastPendingRepair || completesUncheckedSet) setSpeakingFilter("all");
    } catch (speechError) {
      setPhraseSpeechError(
        speechError instanceof Error
          ? speechError.message
          : "Spanish speech could not be transcribed.",
      );
    } finally {
      setRecordingPhraseId((current) => current === item.id ? undefined : current);
    }
  }

  async function renameLearner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await onRenameLearner(displayName.trim());
      setMessage("Learner name updated.");
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "The learner name could not be updated.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteLearner() {
    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await onDeleteLearner(confirmationName);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The learner profile could not be deleted.");
      setSubmitting(false);
    }
  }

  async function updatePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await onUpdatePreferences({ primaryGoal, preferredSessionMinutes });
      setMessage("Learning preferences updated.");
    } catch (preferenceError) {
      setError(preferenceError instanceof Error
        ? preferenceError.message
        : "Learning preferences could not be updated.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={`learner-overview learner-overview-${view}`}
      aria-label={view === "profile" ? "Learner profile" : undefined}
      aria-labelledby={view === "review" ? "review-overview-title" : view === "progress" ? "progress-overview-title" : undefined}
    >
      {view === "progress" && (
        <>
          <div>
            <span className="eyebrow">Saved progress · {overview.learner.displayName}</span>
            <h3 id="progress-overview-title">Your A1 progress</h3>
            <p>See what you have completed and where your learning path goes next.</p>
          </div>
          <dl>
            <div><dt>Lessons complete</dt><dd>{overview.completedLessonCount}</dd></div>
            <div><dt>Topics complete</dt><dd>{overview.completedTopicCount}/{overview.totalTopicCount}</dd></div>
            <div><dt>Phrases started</dt><dd>{overview.introducedItemCount}</dd></div>
          </dl>
          <small>
            {overview.learner.overallLevel} · {overview.learner.a1Band} A1
            {overview.hasCompletedSpeakingTask ? " · speaking practice saved" : " · speaking is included in every lesson"}
          </small>
          <details className="curriculum-map">
            <summary>
              <span>Your A1 learning path</span>
              <strong>{overview.completedTopicCount}/{overview.totalTopicCount} topics</strong>
            </summary>
            <ol>
              {overview.curriculum.map((topic, index) => (
                <li key={topic.key} className={`curriculum-topic ${topic.status}`}>
                  <span className="curriculum-topic-index" aria-hidden="true">
                    {topic.status === "complete" ? "✓" : index + 1}
                  </span>
                  <div>
                    <strong>{topic.title}</strong>
                    <p>{topic.objective}</p>
                  </div>
                  <span className="curriculum-topic-status">
                    {topic.status === "complete" ? "Done" : topic.status === "current" ? "Now" : "Later"}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      {view === "review" && (
        <div className="review-overview-heading">
          <span className="eyebrow">Review</span>
          <h3 id="review-overview-title">
            {overview.dueReviewCount > 0
              ? `${overview.dueReviewCount} phrase${overview.dueReviewCount === 1 ? " is" : "s are"} ready`
              : "Nothing is due right now"}
          </h3>
          <p>
            {overview.dueReviewCount > 0
              ? "Bring these phrases back before they fade. Your next lesson will include the due review."
              : "You can still practise saved phrases, but today’s lesson is the recommended next step."}
          </p>
        </div>
      )}
      {view === "review" && overview.phrasebook.length > 0 && (
        <section className="review-launch" aria-labelledby="review-launch-title">
          <div>
            <span>Optional self-check</span>
            <h4 id="review-launch-title">Practise {Math.min(5, overview.phrasebook.length)} saved phrase{Math.min(5, overview.phrasebook.length) === 1 ? "" : "s"}</h4>
            <p>One phrase at a time · about {Math.max(1, Math.ceil(Math.min(5, overview.phrasebook.length) / 2))} min</p>
          </div>
          <button
            id="phrasebook-review-start"
            className="primary-button"
            type="button"
            onClick={() => onStartReview?.(overview.phrasebook.slice(0, 5))}
          >
            Start phrase practice
          </button>
        </section>
      )}
      {view === "review" && overview.phrasebook.length > 0 && (
        <details className="phrasebook">
          <summary>
            <span>{overview.dueReviewCount > 0 ? "Practise saved Spanish" : "Optional phrase practice"}</span>
            <strong>{overview.phrasebook.length} phrase{overview.phrasebook.length === 1 ? "" : "s"}</strong>
          </summary>
          <p className="phrasebook-help">
            Read the Spanish first. Remember the meaning, listen, then say the phrase aloud.
          </p>
          <div className="phrasebook-search">
            <label htmlFor="phrasebook-query">Find a phrase</label>
            <input
              id="phrasebook-query"
              type="search"
              value={phraseQuery}
              disabled={Boolean(recordingPhraseId) || Boolean(playingPhraseId)}
              onChange={(event) => setPhraseQuery(event.target.value)}
              placeholder="Search in Spanish or English"
              aria-describedby="phrasebook-search-help"
              aria-controls="phrasebook-results"
            />
            <small id="phrasebook-search-help">You can type without accents. Stop speaking or wait for the audio to finish before searching.</small>
            {phraseQuery && (
              <button
                className="text-button"
                type="button"
                disabled={Boolean(recordingPhraseId) || Boolean(playingPhraseId)}
                onClick={() => setPhraseQuery("")}
              >
                Clear search
              </button>
            )}
          </div>
          <p className="phrasebook-search-count" role="status">
            {visiblePhrases.length} of {overview.phrasebook.length} phrases
            {visiblePhrases.length === 0 && ". No phrases found. Try another word or clear your search."}
          </p>
          {speakingFilter !== "all" && (
            <div className="phrasebook-repair-filter">
              <span role="status">
                {speakingFilter === "repair"
                  ? "Showing phrases still to repair this visit."
                  : "Showing phrases not checked this visit."}
              </span>
              <button className="text-button" type="button" onClick={() => setSpeakingFilter("all")}>
                Show all phrases
              </button>
            </div>
          )}
          <button
            className="secondary-button phrasebook-recall-start"
            type="button"
            disabled={visiblePhrases.length === 0 || Boolean(recordingPhraseId) || Boolean(playingPhraseId)}
            onClick={() => onStartReview?.(visiblePhrases.slice(0, 5))}
          >
            Practise from memory
          </button>
          <p className="phrasebook-help">Practise these search results in short sets of up to five phrases. You can stop after any set.</p>
          {spokenPhraseIds.length > 0 && (
            <>
              <p className="phrasebook-help phrasebook-speaking-progress" role="status">
                Speaking this visit: {spokenPhraseIds.length} of {overview.phrasebook.length} saved {overview.phrasebook.length === 1 ? "phrase" : "phrases"} checked.
              </p>
              {spokenPhraseIds.length < overview.phrasebook.length && (
                <button
                  className="text-button phrasebook-unchecked-filter"
                  type="button"
                  disabled={Boolean(recordingPhraseId) || Boolean(playingPhraseId)}
                  onClick={() => {
                    setPhraseQuery("");
                    setSpeakingFilter("unchecked");
                  }}
                >
                  Show unchecked phrases
                </button>
              )}
              {spokenPhraseIds.length === overview.phrasebook.length && (
                <div className="phrasebook-speaking-complete">
                  <span role="status">Speaking set complete. You checked every saved phrase this visit.</span>
                  <span className="phrasebook-speaking-summary">
                    Repairs completed: {repairedPhraseCount} {repairedPhraseCount === 1 ? "phrase" : "phrases"}. Still to repair: {pendingRepairCount} {pendingRepairCount === 1 ? "phrase" : "phrases"}.
                  </span>
                  {pendingRepairCount > 0 && (
                    <button
                      className="text-button"
                      type="button"
                      disabled={Boolean(recordingPhraseId) || Boolean(playingPhraseId)}
                      onClick={() => {
                        setPhraseQuery("");
                        setSpeakingFilter("repair");
                      }}
                    >
                      Show phrases to repair
                    </button>
                  )}
                  <button
                    className="text-button"
                    type="button"
                    disabled={Boolean(recordingPhraseId) || Boolean(playingPhraseId)}
                    onClick={() => {
                      setSpokenPhraseIds([]);
                      setPhraseSpeechResults({});
                      setPhraseRepairState({});
                      setPhraseSpeechError(undefined);
                      setPhraseQuery("");
                      setSpeakingFilter("all");
                    }}
                  >
                    Start speaking set again
                  </button>
                </div>
              )}
            </>
          )}
          <ul id="phrasebook-results">
            {visiblePhrases.map((item) => {
              const itemSpeechResult = phraseSpeechResults[item.id];
              const repairWords = itemSpeechResult && itemSpeechResult.assessment.status !== "matched"
                ? itemSpeechResult.assessment.missingWords
                : [];
              const needsRepair = phraseRepairState[item.id] === "needs-repair";
              const repairedPhrase = itemSpeechResult?.assessment.status === "matched"
                && phraseRepairState[item.id] === "repaired";
              const speakingStatus = needsRepair
                ? "Needs repair"
                : phraseRepairState[item.id] === "repaired"
                  ? "Repaired"
                  : spokenPhraseIds.includes(item.id)
                    ? "Checked"
                    : undefined;

              return (
              <li key={item.id}>
                <div className="phrasebook-phrase">
                  <strong lang="es">{item.targetText}</strong>
                  <button
                    className="phrasebook-listen"
                    data-ui-sound="off"
                    type="button"
                    disabled={Boolean(recordingPhraseId) || playingPhraseId === item.id}
                    aria-label={`Listen to ${item.targetText} in Spanish`}
                    onClick={() => void playPhrase(item)}
                  >
                    <span aria-hidden="true">▶</span>
                    {playingPhraseId === item.id ? "Playing…" : "Listen"}
                  </button>
                </div>
                {speakingStatus && (
                  <span className={`phrasebook-speaking-status ${speakingStatus.toLowerCase().replace(" ", "-")}`}>
                    {speakingStatus}
                  </span>
                )}
                <button
                  className="phrasebook-speak"
                  data-ui-sound="off"
                  type="button"
                  disabled={Boolean(recordingPhraseId && recordingPhraseId !== item.id)}
                  aria-label={recordingPhraseId === item.id
                    ? `Stop practising ${item.targetText}`
                    : itemSpeechResult
                      ? itemSpeechResult.assessment.status === "matched"
                        ? `Say ${item.targetText} again`
                        : `Try saying ${item.targetText} again`
                      : needsRepair
                        ? `Try saying ${item.targetText} again`
                        : `Practise saying ${item.targetText}`}
                  onClick={() => {
                    if (recordingPhraseId === item.id) phraseSpeechProvider.current.stop();
                    else void startPhraseRehearsal(item);
                  }}
                >
                  {recordingPhraseId === item.id
                    ? "■ Stop and check"
                    : itemSpeechResult
                      ? itemSpeechResult.assessment.status === "matched"
                        ? "● Say it again"
                        : "● Try speaking again"
                      : needsRepair
                        ? "● Try speaking again"
                        : "● Practise speaking"}
                </button>
                {recordingPhraseId === item.id && (
                  <p className="phrasebook-recording" role="status">
                    Listening… Say the phrase, then stop the microphone.
                  </p>
                )}
                {itemSpeechResult && (
                  <div className={`phrasebook-transcript ${itemSpeechResult.assessment.status}`} aria-live="polite">
                    <small>The browser heard</small>
                    <p lang="es">{itemSpeechResult.transcript}</p>
                    <span>{itemSpeechResult.assessment.feedback}</span>
                  </div>
                )}
                {repairedPhrase && (
                  <p className="phrasebook-repair-success" role="status">
                    Nice repair. You completed the full phrase after focusing on the missing words.
                  </p>
                )}
                {repairWords.length > 0 && (
                  <div className="phrasebook-repair-guide">
                    <strong>Focus words</strong>
                    <p lang="es">{repairWords.join(" · ")}</p>
                    <span>Listen to these words, then say the whole phrase again.</span>
                    <button
                      className="phrasebook-listen"
                      data-ui-sound="off"
                      type="button"
                      disabled={Boolean(recordingPhraseId) || playingPhraseId === item.id}
                      onClick={() => void playPhrase(item, repairWords.join(" "))}
                    >
                      <span aria-hidden="true">▶</span>
                      {playingPhraseId === item.id ? "Playing…" : "Listen to focus words"}
                    </button>
                  </div>
                )}
                <details>
                  <summary>Show meaning</summary>
                  <span>{item.supportText}</span>
                </details>
              </li>
              );
            })}
          </ul>
          {phraseAudioError && <p className="phrasebook-audio-error" role="alert">{phraseAudioError}</p>}
          {phraseSpeechError && <p className="phrasebook-audio-error" role="alert">{phraseSpeechError}</p>}
          <p className="phrasebook-privacy-note">
            Audio is not saved by Spanish Coach. Browser transcription can be wrong, and this practice does not score pronunciation or change your saved progress.
          </p>
        </details>
      )}
      {view === "review" && overview.phrasebook.length === 0 && (
        <p className="empty-review-note">Complete your first lesson to start building a phrase review set.</p>
      )}
      {showProfile && <>
      <div className="learner-profile-actions">
        <button className="text-button" type="button" onClick={onChangeLearner}>
          Change learner
        </button>
        <button
          className="text-button"
          type="button"
          aria-expanded={managing}
          aria-controls="learner-profile-management"
          onClick={() => {
            setManaging((value) => !value);
            setDisplayName(overview.learner.displayName);
            setPrimaryGoal(overview.learner.primaryGoal);
            setPreferredSessionMinutes(overview.learner.preferredSessionMinutes);
            setConfirmationName("");
            setConfirmingDelete(false);
            setError(undefined);
            setMessage(undefined);
          }}
        >
          {managing ? "Close profile settings" : "Manage profile"}
        </button>
      </div>

      {managing && (
        <div className="learner-profile-management" id="learner-profile-management">
          <form className="learner-name-form" onSubmit={renameLearner}>
            <label>
              Learner name
              <input
                required
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <button
              className="secondary-button"
              type="submit"
              disabled={submitting || !displayName.trim() || displayName.trim() === overview.learner.displayName}
            >
              {submitting ? "Saving…" : "Save name"}
            </button>
          </form>

          <form className="learner-preferences-form" onSubmit={updatePreferences}>
            <label>
              Main learning goal
              <select
                value={primaryGoal}
                onChange={(event) => setPrimaryGoal(event.target.value as LearnerPrimaryGoal)}
              >
                {learnerPrimaryGoals.map((goal) => (
                  <option key={goal} value={goal}>{learnerPrimaryGoalLabels[goal]}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Preferred lesson length</legend>
              <div className="profile-duration-options">
                {supportedSessionDurations.map((minutes) => (
                  <label key={minutes} className={preferredSessionMinutes === minutes ? "chosen" : ""}>
                    <input
                      type="radio"
                      name="profile-duration"
                      checked={preferredSessionMinutes === minutes}
                      onChange={() => setPreferredSessionMinutes(minutes)}
                    />
                    {minutes} min
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              className="secondary-button"
              type="submit"
              disabled={
                submitting
                || (
                  primaryGoal === overview.learner.primaryGoal
                  && preferredSessionMinutes === overview.learner.preferredSessionMinutes
                )
              }
            >
              {submitting ? "Saving…" : "Save learning preferences"}
            </button>
          </form>

          {!confirmingDelete ? (
            <button
              className="text-button danger-text-button"
              type="button"
              onClick={() => {
                setConfirmingDelete(true);
                setMessage(undefined);
              }}
            >
              Delete profile and progress
            </button>
          ) : (
            <div className="profile-delete-confirmation" role="group" aria-labelledby="profile-delete-title">
              <strong id="profile-delete-title">Permanently delete this learner?</strong>
              <p>
                Lessons, attempts, reviews, feedback, and mistake memory for this learner will be deleted.
                This cannot be undone.
              </p>
              <label>
                Type <strong>{overview.learner.displayName}</strong> to confirm
                <input
                  autoComplete="off"
                  value={confirmationName}
                  onChange={(event) => setConfirmationName(event.target.value)}
                />
              </label>
              <div>
                <button
                  className="text-button"
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setConfirmingDelete(false);
                    setConfirmationName("");
                    setError(undefined);
                  }}
                >
                  Keep profile
                </button>
                <button
                  className="danger-button"
                  type="button"
                  disabled={submitting || confirmationName !== overview.learner.displayName}
                  onClick={deleteLearner}
                >
                  {submitting ? "Deleting…" : "Permanently delete profile"}
                </button>
              </div>
            </div>
          )}
          {message && <p className="profile-management-message" role="status">{message}</p>}
          {error && <p className="feedback retry" role="alert">{error}</p>}
        </div>
      )}
      </>}
    </section>
  );
}
