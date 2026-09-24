"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyProgress,
  getExerciseCoaching,
  getLessonRecallItems,
  getLessonDefinition,
  type LessonExercise,
  type LessonKey,
  type LessonProgress,
} from "@/domain/lesson";
import type { LearnerProgressSummary } from "@/domain/progress";
import { getListeningClip } from "@/domain/listening";
import type { MistakeMemory } from "@/domain/mistake";
import { BrowserSpeechToTextProvider } from "@/stt/browser-provider";
import type { SttTranscript } from "@/stt/provider";
import type { TeacherFeedback } from "@/teacher/provider";
import { speakWithBrowser } from "@/tts/browser-provider";
import { PilotFeedbackForm } from "./pilot-feedback-form";
import type { CoachMode } from "./coach-experience";

type LessonExperienceProps = {
  learnerId: string;
  planId: string;
  sessionId: string;
  lessonKey: LessonKey;
  reviewExercises: LessonExercise[];
  onEndLesson: () => Promise<void>;
  onFinishLesson: (destination: "next" | "dashboard") => Promise<boolean>;
  onModeChange: (mode: CoachMode) => void;
};

type AttemptResponse = {
  correct: boolean;
  feedback: string;
  nextReviewAt: string;
  progress: LessonProgress;
  teacherFeedback?: TeacherFeedback;
  mistakeMemory?: MistakeMemory;
};

const modalityLabels: Record<LessonExercise["modality"], { label: string; guidance: string }> = {
  recognition: {
    label: "Understand",
    guidance: "Notice the meaning before you try to produce the phrase yourself.",
  },
  recall: {
    label: "Recall",
    guidance: "Bring the Spanish phrase back from memory.",
  },
  listening: {
    label: "Listen",
    guidance: "Listen for the useful words in natural Spanish.",
  },
  production: {
    label: "Speak",
    guidance: "Use the language yourself in a short spoken answer.",
  },
};

function TeacherFeedbackCard({ feedback }: { feedback: TeacherFeedback }) {
  return (
    <aside className="teacher-feedback" aria-labelledby="teacher-feedback-title">
      <div className="teacher-feedback-heading">
        <span className="coach-mark">C</span>
        <div>
          <small>{feedback.generationMode === "deterministic" ? "Local teacher" : "AI teacher"}</small>
          <h3 id="teacher-feedback-title">{feedback.summary}</h3>
        </div>
      </div>
      <p>{feedback.praise}</p>
      {feedback.corrections.length > 0 && (
        <ul>
          {feedback.corrections.map((correction) => (
            <li key={`${correction.issue}-${correction.suggestion}`}>
              <strong lang="es">{correction.suggestion}</strong>
              <span>{correction.explanation}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="teacher-next-step"><strong>Next:</strong> {feedback.nextStep}</p>
      <small className="teacher-provider">
        {feedback.providerId} · {feedback.providerVersion} · pronunciation not assessed
      </small>
    </aside>
  );
}

function MistakeMemoryCard({ memory }: { memory: MistakeMemory }) {
  if (memory.items.length === 0) return null;
  return (
    <aside className="mistake-memory" aria-labelledby="mistake-memory-title">
      <div>
        <small>Practice memory</small>
        <h3 id="mistake-memory-title">Patterns the coach will bring back</h3>
      </div>
      <ul>
        {memory.items.map((item) => (
          <li key={item.code}>
            <div>
              <strong lang="es">{item.targetPattern}</strong>
              <span>{item.explanation}</span>
            </div>
            <small className={`memory-status ${item.status}`}>
              {item.status === "active" ? `seen ${item.occurrenceCount}×` : "improving"}
            </small>
          </li>
        ))}
      </ul>
      <p>Two later successful examples are required before a pattern is resolved.</p>
    </aside>
  );
}

export function LessonExperience({
  learnerId,
  planId,
  sessionId,
  lessonKey,
  reviewExercises,
  onEndLesson,
  onFinishLesson,
  onModeChange,
}: LessonExperienceProps) {
  const [progress, setProgress] = useState<LessonProgress>();
  const [progressSummary, setProgressSummary] = useState<LearnerProgressSummary>();
  const [selectedOption, setSelectedOption] = useState<string>();
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>();
  const [pendingProgress, setPendingProgress] = useState<LessonProgress>();
  const [nextReviewAt, setNextReviewAt] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [audioStatus, setAudioStatus] = useState<string>();
  const [playingAudio, setPlayingAudio] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [speechResult, setSpeechResult] = useState<SttTranscript>();
  const [speechError, setSpeechError] = useState<string>();
  const [teacherFeedback, setTeacherFeedback] = useState<TeacherFeedback>();
  const [mistakeMemory, setMistakeMemory] = useState<MistakeMemory>();
  const speechProvider = useRef(new BrowserSpeechToTextProvider());
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [endingLesson, setEndingLesson] = useState(false);
  const [endLessonError, setEndLessonError] = useState<string>();
  const [revealedRecallItems, setRevealedRecallItems] = useState<string[]>([]);
  const [nextLessonTitle, setNextLessonTitle] = useState<string>();
  const [leavingCompletion, setLeavingCompletion] = useState<"next" | "dashboard">();
  const [completionError, setCompletionError] = useState<string>();
  const lesson = getLessonDefinition(lessonKey);

  if (!lesson) throw new Error("Unknown lesson");
  const exercises = useMemo(
    () => [...reviewExercises, ...lesson.exercises],
    [lesson.exercises, reviewExercises],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/lesson/progress?learnerId=${encodeURIComponent(learnerId)}&lessonKey=${encodeURIComponent(lessonKey)}&sessionId=${encodeURIComponent(sessionId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          progress?: LessonProgress;
          summary?: LearnerProgressSummary;
          error?: string;
        };
        if (!response.ok || !payload.progress) {
          throw new Error(payload.error ?? "Lesson progress could not be loaded.");
        }
        return payload;
      })
      .then((loaded) => {
        setProgress(loaded.progress);
        setProgressSummary(loaded.summary);
        setLoadError(undefined);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Lesson progress could not be loaded.");
      });

    fetch(`/api/teacher/feedback?learnerId=${encodeURIComponent(learnerId)}&lessonKey=${encodeURIComponent(lessonKey)}&sessionId=${encodeURIComponent(sessionId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return undefined;
        const payload = (await response.json()) as { teacherFeedback?: TeacherFeedback | null };
        return payload.teacherFeedback ?? undefined;
      })
      .then(setTeacherFeedback)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    fetch(`/api/mistakes?learnerId=${encodeURIComponent(learnerId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return undefined;
        const payload = (await response.json()) as { mistakeMemory?: MistakeMemory };
        return payload.mistakeMemory;
      })
      .then(setMistakeMemory)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [learnerId, lessonKey, sessionId, reloadKey]);

  useEffect(() => {
    const provider = speechProvider.current;
    return () => provider.abort();
  }, []);

  const currentProgress = progress ?? createEmptyProgress();
  const exercise = useMemo(
    () =>
      exercises.find(
        (item) => !currentProgress.completedExerciseIds.includes(item.id),
      ),
    [currentProgress.completedExerciseIds, exercises],
  );
  const completedStepCount = currentProgress.completedExerciseIds.filter((id) =>
    exercises.some((item) => item.id === id)).length;
  const currentStepNumber = Math.min(completedStepCount + 1, exercises.length);
  const percent = Math.round(
    (completedStepCount / exercises.length) * 100,
  );
  const pendingCompletesLesson = Boolean(
    pendingProgress
    && exercises.every((item) => pendingProgress.completedExerciseIds.includes(item.id)),
  );
  const exerciseCoaching = exercise ? getExerciseCoaching(exercise) : undefined;

  useEffect(() => {
    if (!progress) return;
    if (exercise) {
      onModeChange("lesson");
      return;
    }

    onModeChange("completion");
    const controller = new AbortController();
    fetch(`/api/learner/overview?learnerId=${encodeURIComponent(learnerId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return undefined;
        const payload = (await response.json()) as { overview?: { nextLesson?: { title?: string } } };
        return payload.overview?.nextLesson?.title;
      })
      .then(setNextLessonTitle)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [exercise, learnerId, onModeChange, progress]);

  async function leaveCompletion(destination: "next" | "dashboard") {
    if (leavingCompletion) return;
    setLeavingCompletion(destination);
    setCompletionError(undefined);
    const movedOn = await onFinishLesson(destination);
    if (!movedOn) {
      setCompletionError("The next lesson could not be prepared. Your completed lesson is safe; please try again.");
    }
    setLeavingCompletion(undefined);
  }

  async function submitAnswer() {
    if (!exercise || !selectedOption || submitting) return;
    setSubmitting(true);
    setLoadError(undefined);
    try {
      const response = await fetch("/api/lesson/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId,
          planId,
          sessionId,
          lessonKey,
          exerciseId: exercise.id,
          selectedOptionId: selectedOption,
        }),
      });
      const payload = (await response.json()) as AttemptResponse & { error?: string };
      if (!response.ok || !payload.progress) {
        throw new Error(payload.error ?? "The answer could not be saved.");
      }

      void refreshProgressSummary();
      if (payload.mistakeMemory) setMistakeMemory(payload.mistakeMemory);
      setNextReviewAt(payload.nextReviewAt);
      setFeedback({ correct: payload.correct, message: payload.feedback });
      if (payload.correct) {
        setPendingProgress(payload.progress);
      } else {
        setProgress(payload.progress);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "The answer could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function playListeningAudio() {
    if (!exercise?.listeningClipId || playingAudio) return;
    const clip = getListeningClip(exercise.listeningClipId);
    if (!clip) {
      setAudioStatus("This listening clip is unavailable.");
      return;
    }

    setPlayingAudio(true);
    setAudioStatus("Preparing Spanish audio…");
    try {
      const response = await fetch(`/api/tts/${encodeURIComponent(clip.id)}`);
      if (response.ok) {
        const objectUrl = URL.createObjectURL(await response.blob());
        try {
          const audio = new Audio(objectUrl);
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error("The Spanish audio could not be played."));
            void audio.play().catch(reject);
          });
          const cacheStatus = response.headers.get("X-TTS-Cache") ?? "unknown";
          setAudioStatus(`Played with local Piper audio · cache ${cacheStatus}.`);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      } else {
        const result = await speakWithBrowser(clip);
        setAudioStatus(`Played with the browser’s Spanish voice: ${result.voiceId}.`);
      }
    } catch (error) {
      setAudioStatus(error instanceof Error ? error.message : "Spanish audio is unavailable.");
    } finally {
      setPlayingAudio(false);
    }
  }

  async function startSpeaking() {
    if (!exercise?.speakingTask || recognizing) return;
    setRecognizing(true);
    setSpeechResult(undefined);
    setSpeechError(undefined);
    setTeacherFeedback(undefined);
    setFeedback(undefined);
    setLoadError(undefined);
    try {
      setSpeechResult(await speechProvider.current.transcribe(exercise.speakingTask));
    } catch (error) {
      setSpeechError(error instanceof Error ? error.message : "Spanish speech could not be transcribed.");
    } finally {
      setRecognizing(false);
    }
  }

  async function submitSpeakingAttempt() {
    if (!exercise?.speakingTask || !speechResult || submitting) return;
    setSubmitting(true);
    setLoadError(undefined);
    try {
      const response = await fetch("/api/lesson/speaking-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId,
          planId,
          sessionId,
          lessonKey,
          exerciseId: exercise.id,
          transcript: speechResult.text,
          evidenceProvider: speechResult.providerId,
          providerConfidence: speechResult.confidence,
        }),
      });
      const payload = (await response.json()) as AttemptResponse & { error?: string };
      if (!response.ok || !payload.progress) {
        throw new Error(payload.error ?? "The speaking attempt could not be saved.");
      }

      void refreshProgressSummary();
      setNextReviewAt(payload.nextReviewAt);
      setFeedback({ correct: payload.correct, message: payload.feedback });
      setTeacherFeedback(payload.teacherFeedback);
      setMistakeMemory(payload.mistakeMemory);
      if (payload.correct) {
        setPendingProgress(payload.progress);
      } else {
        setProgress(payload.progress);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "The speaking attempt could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  function continueAfterFeedback() {
    if (!pendingProgress) return;
    const completesLesson = exercises.every((item) =>
      pendingProgress.completedExerciseIds.includes(item.id));
    setProgress(pendingProgress);
    setPendingProgress(undefined);
    setSelectedOption(undefined);
    setSpeechResult(undefined);
    setFeedback(undefined);
    setSpeechError(undefined);
    if (!completesLesson) setTeacherFeedback(undefined);
  }

  async function refreshProgressSummary() {
    try {
      const response = await fetch(
        `/api/lesson/progress?learnerId=${encodeURIComponent(learnerId)}&lessonKey=${encodeURIComponent(lessonKey)}&sessionId=${encodeURIComponent(sessionId)}`,
      );
      if (!response.ok) return;
      const payload = (await response.json()) as { summary?: LearnerProgressSummary };
      setProgressSummary(payload.summary);
    } catch {
      // The attempt is already saved. A summary can be refreshed on the next visit.
    }
  }

  async function endLesson() {
    if (endingLesson) return;
    setEndingLesson(true);
    setEndLessonError(undefined);
    try {
      speechProvider.current.abort();
      await onEndLesson();
    } catch (error) {
      setEndLessonError(
        error instanceof Error ? error.message : "The lesson could not be ended safely.",
      );
      setEndingLesson(false);
    }
  }

  if (loadError && !progress) {
    return (
      <section className="lesson-card loading-card" role="alert">
        <div>
          <p>{loadError}</p>
          <button className="secondary-button" onClick={() => setReloadKey((value) => value + 1)}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!progress) {
    return <div className="lesson-card loading-card">Loading your saved lesson…</div>;
  }

  if (!exercise) {
    const practisedPhrases = Array.from(
      new Map(
        lesson.exercises.map((item) => [item.learningItem.id, item.learningItem]),
      ).values(),
    ).slice(0, 4);
    const recallItems = getLessonRecallItems(lesson);

    return (
      <section className="lesson-card completion-card" aria-labelledby="lesson-complete">
        <span className="eyebrow">Lesson complete</span>
        <h2 id="lesson-complete">{lesson.completionTitle}</h2>
        <p>{lesson.completionSummary}</p>
        <section className="lesson-achievement" aria-labelledby="lesson-achievement-title">
          <span>You can now</span>
          <h3 id="lesson-achievement-title">{lesson.objective}</h3>
          <p>You completed the full practice path: understanding, recall, listening, and speaking.</p>
        </section>
        <dl className="summary-grid">
          <div><dt>Steps completed</dt><dd>{exercises.length}/{exercises.length}</dd></div>
          <div><dt>Attempts</dt><dd>{progress.attempts}</dd></div>
          <div><dt>Phrases started</dt><dd>{progressSummary?.introducedItemCount ?? "—"}</dd></div>
        </dl>
        <div className="completion-actions" aria-label="Choose what to do next">
          <button
            className="primary-button"
            disabled={Boolean(leavingCompletion)}
            onClick={() => void leaveCompletion("next")}
          >
            {leavingCompletion === "next"
              ? "Preparing the next lesson…"
              : nextLessonTitle
                ? `Continue: ${nextLessonTitle}`
                : "Continue to the next lesson"}
          </button>
          <button
            className="text-button"
            disabled={Boolean(leavingCompletion)}
            onClick={() => void leaveCompletion("dashboard")}
          >
            {leavingCompletion === "dashboard" ? "Saving…" : "Finish for today"}
          </button>
        </div>
        {completionError && <p className="feedback retry" role="alert">{completionError}</p>}
        <p className="saved-progress-note">Your answers, transcript, and review schedule are saved automatically.</p>
        <details className="completion-details">
          <summary>Review lesson details</summary>
          <section className="lesson-language-recap" aria-labelledby="lesson-language-recap-title">
            <h3 id="lesson-language-recap-title">Useful Spanish from this lesson</h3>
            <ul>
              {practisedPhrases.map((item) => (
                <li key={item.id}>
                  <strong lang="es">{item.targetText}</strong>
                  <span>{item.supportText}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="lesson-recall-check" aria-labelledby="lesson-recall-check-title">
            <div className="lesson-recall-heading">
              <div>
                <span>Quick recall</span>
                <h3 id="lesson-recall-check-title">Can you remember these without looking?</h3>
              </div>
              <small>{revealedRecallItems.length}/{recallItems.length} checked</small>
            </div>
            <p>Think of the Spanish first. Reveal the answer only after you have tried.</p>
            <div className="lesson-recall-list">
              {recallItems.map((item) => {
                const revealed = revealedRecallItems.includes(item.id);
                return (
                  <article className="lesson-recall-item" key={item.id}>
                    <span>{item.supportText}</span>
                    {revealed ? (
                      <strong lang="es">{item.targetText}</strong>
                    ) : (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setRevealedRecallItems((current) => [...current, item.id])}
                      >
                        Reveal Spanish
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
            <small className="lesson-recall-note">This is a memory check, not a test. Your scheduled reviews remain unchanged.</small>
          </section>
          {progressSummary && (
            <div className="progress-next-step" aria-label="Your next practice step">
              <strong>Your review schedule</strong>
              <p>
                {progressSummary.dueReviewCount > 0
                  ? `${progressSummary.dueReviewCount} phrase${progressSummary.dueReviewCount === 1 ? " is" : "s are"} ready to review now.`
                  : progressSummary.nextReviewAt
                    ? `Your next scheduled review is ${new Date(progressSummary.nextReviewAt).toLocaleString()}.`
                    : "Keep practising the current phrases to build recall."}
              </p>
              <small>
                {progressSummary.reviewedTodayCount} phrase{progressSummary.reviewedTodayCount === 1 ? "" : "s"} practised today
                {progressSummary.hasCompletedSpeakingTask ? " · speaking task completed" : ""}.
              </small>
            </div>
          )}
          {!progressSummary && nextReviewAt && (
            <p className="review-note">Latest review scheduled for {new Date(nextReviewAt).toLocaleString()}.</p>
          )}
          {teacherFeedback && <TeacherFeedbackCard feedback={teacherFeedback} />}
          {mistakeMemory && <MistakeMemoryCard memory={mistakeMemory} />}
        </details>
        <details className="completion-details feedback-details">
          <summary>Rate this lesson <span>Optional</span></summary>
          <PilotFeedbackForm learnerId={learnerId} sessionId={sessionId} />
        </details>
      </section>
    );
  }

  return (
    <section className="lesson-card" aria-labelledby="exercise-title">
      <div className="lesson-progress" aria-label={`${percent}% complete`}>
        <div className="progress-copy">
          <span>Step {currentStepNumber} of {exercises.length}</span>
          <span>{percent}%</span>
        </div>
        <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
      </div>

      <div className="lesson-session-actions">
        <button className="text-button" type="button" onClick={() => setConfirmingEnd(true)}>
          End this lesson
        </button>
      </div>

      {confirmingEnd && (
        <div className="end-lesson-confirmation" role="group" aria-labelledby="end-lesson-title">
          <div>
            <strong id="end-lesson-title">End this lesson?</strong>
            <p>Your saved answers and review progress will stay. This unfinished plan will close.</p>
          </div>
          <div className="end-lesson-actions">
            <button
              className="text-button"
              type="button"
              disabled={endingLesson}
              onClick={() => {
                setConfirmingEnd(false);
                setEndLessonError(undefined);
              }}
            >
              Keep learning
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={endingLesson}
              onClick={() => void endLesson()}
            >
              {endingLesson ? "Ending lesson…" : "End lesson now"}
            </button>
          </div>
          {endLessonError && <p className="feedback retry" role="alert">{endLessonError}</p>}
        </div>
      )}

      <div className="exercise-stage" aria-label={`Current practice: ${modalityLabels[exercise.modality].label}`}>
        <span>{modalityLabels[exercise.modality].label}</span>
        <p>{modalityLabels[exercise.modality].guidance}</p>
      </div>
      <span className="eyebrow">{exercise.eyebrow}</span>
      <h2 id="exercise-title">{exercise.prompt}</h2>
      <p className="context">{exercise.context}</p>

      {exercise.listeningClipId && (
        <div className="audio-control">
          <button
            className="secondary-button"
            disabled={playingAudio}
            onClick={playListeningAudio}
            type="button"
          >
            {playingAudio ? "Playing…" : "▶ Play Spanish audio"}
          </button>
          <small aria-live="polite">{audioStatus ?? "Listen before choosing an answer."}</small>
        </div>
      )}

      {exercise.speakingTask ? (
        <div className="speaking-control">
          <button
            className="secondary-button microphone-button"
            disabled={submitting || Boolean(pendingProgress)}
            onClick={() => {
              if (recognizing) speechProvider.current.stop();
              else void startSpeaking();
            }}
            type="button"
          >
            {recognizing ? "■ Stop listening" : "● Start microphone"}
          </button>
          <p className="recording-guidance" aria-live="polite">
            {recognizing
              ? "Listening… Say the whole answer, then press Stop listening. Transcription starts only after you stop."
              : "Press Start microphone, say the complete answer, then stop the microphone yourself."}
          </p>
          <p className="privacy-note">
            Audio is not stored by Spanish Coach. Your browser may use its speech service to create
            the transcript.
          </p>
          {speechError && <p className="feedback retry" role="alert">{speechError}</p>}
          {speechResult && (
            <div className="transcript" aria-live="polite">
              <small>Transcript from the browser</small>
              <p lang="es">{speechResult.text}</p>
              <span>Check the words before saving; transcription can be wrong.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="options" role="radiogroup" aria-label="Answer choices">
          {exercise.options.map((option) => (
            <button
              className={`option ${selectedOption === option.id ? "selected" : ""}`}
              key={option.id}
              role="radio"
              aria-checked={selectedOption === option.id}
              disabled={submitting || Boolean(pendingProgress)}
              onClick={() => {
                setSelectedOption(option.id);
                setFeedback(undefined);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <p
          className={`feedback ${feedback.correct ? "correct" : "retry"}`}
          role={feedback.correct ? "status" : "alert"}
        >
          {feedback.message}
        </p>
      )}
      {feedback && exerciseCoaching && (
        <aside className={`exercise-coaching ${feedback.correct ? "transfer" : "retry"}`} aria-live="polite">
          {feedback.correct ? (
            <>
              <small>Use it again</small>
              <h3>Move the phrase to a new situation</h3>
              <p>{exerciseCoaching.transferPrompt}</p>
              <div className="coaching-target">
                <span>Useful Spanish</span>
                <strong lang="es">{exerciseCoaching.targetPhrase}</strong>
              </div>
            </>
          ) : (
            <>
              <small>Coach hint</small>
              <h3>Notice this before you try again</h3>
              <p>{exerciseCoaching.notice}</p>
              <div className="coaching-target">
                <span>Target phrase</span>
                <strong lang="es">{exerciseCoaching.targetPhrase}</strong>
              </div>
              <p className="coaching-explanation">{exerciseCoaching.explanation}</p>
              <strong className="coaching-action">Choose again and check the meaning.</strong>
            </>
          )}
        </aside>
      )}
      {teacherFeedback && <TeacherFeedbackCard feedback={teacherFeedback} />}
      {mistakeMemory && <MistakeMemoryCard memory={mistakeMemory} />}
      {loadError && <p className="feedback retry" role="alert">{loadError}</p>}

      <button
        className="primary-button"
        disabled={pendingProgress
          ? submitting
          : exercise.speakingTask
            ? !speechResult || recognizing || submitting
            : !selectedOption || submitting}
        onClick={pendingProgress
          ? continueAfterFeedback
          : exercise.speakingTask
            ? submitSpeakingAttempt
            : submitAnswer}
      >
        {submitting
          ? "Saving…"
          : pendingProgress
            ? pendingCompletesLesson ? "View lesson summary" : "Continue"
            : exercise.speakingTask ? "Check spoken answer" : "Check answer"}
      </button>
    </section>
  );
}
