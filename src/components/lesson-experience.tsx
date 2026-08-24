"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createEmptyProgress, introductionLesson, type LessonProgress } from "@/domain/lesson";
import { getListeningClip } from "@/domain/listening";
import type { MistakeMemory } from "@/domain/mistake";
import { BrowserSpeechToTextProvider } from "@/stt/browser-provider";
import type { SttTranscript } from "@/stt/provider";
import type { TeacherFeedback } from "@/teacher/provider";
import { speakWithBrowser } from "@/tts/browser-provider";

type LessonExperienceProps = {
  learnerId: string;
};

type AttemptResponse = {
  correct: boolean;
  feedback: string;
  nextReviewAt: string;
  progress: LessonProgress;
  teacherFeedback?: TeacherFeedback;
  mistakeMemory?: MistakeMemory;
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

export function LessonExperience({ learnerId }: LessonExperienceProps) {
  const [progress, setProgress] = useState<LessonProgress>();
  const [selectedOption, setSelectedOption] = useState<string>();
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>();
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

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/lesson/progress?learnerId=${encodeURIComponent(learnerId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as { progress?: LessonProgress; error?: string };
        if (!response.ok || !payload.progress) {
          throw new Error(payload.error ?? "Lesson progress could not be loaded.");
        }
        return payload.progress;
      })
      .then((loadedProgress) => {
        setProgress(loadedProgress);
        setLoadError(undefined);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Lesson progress could not be loaded.");
      });

    fetch(`/api/teacher/feedback?learnerId=${encodeURIComponent(learnerId)}`, {
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
  }, [learnerId, reloadKey]);

  useEffect(() => {
    const provider = speechProvider.current;
    return () => provider.abort();
  }, []);

  const currentProgress = progress ?? createEmptyProgress();
  const exercise = useMemo(
    () =>
      introductionLesson.find(
        (item) => !currentProgress.completedExerciseIds.includes(item.id),
      ),
    [currentProgress.completedExerciseIds],
  );
  const percent = Math.round(
    (currentProgress.completedExerciseIds.length / introductionLesson.length) * 100,
  );

  async function submitAnswer() {
    if (!exercise || !selectedOption || submitting) return;
    setSubmitting(true);
    setLoadError(undefined);
    try {
      const response = await fetch("/api/lesson/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, exerciseId: exercise.id, selectedOptionId: selectedOption }),
      });
      const payload = (await response.json()) as AttemptResponse & { error?: string };
      if (!response.ok || !payload.progress) {
        throw new Error(payload.error ?? "The answer could not be saved.");
      }

      setProgress(payload.progress);
      setNextReviewAt(payload.nextReviewAt);
      setFeedback({ correct: payload.correct, message: payload.feedback });
      if (payload.correct) {
        window.setTimeout(() => {
          setSelectedOption(undefined);
          setFeedback(undefined);
        }, 1100);
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

      setProgress(payload.progress);
      setNextReviewAt(payload.nextReviewAt);
      setFeedback({ correct: payload.correct, message: payload.feedback });
      setTeacherFeedback(payload.teacherFeedback);
      setMistakeMemory(payload.mistakeMemory);
      if (payload.correct) {
        window.setTimeout(() => {
          setSpeechResult(undefined);
          setFeedback(undefined);
        }, 1600);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "The speaking attempt could not be saved.");
    } finally {
      setSubmitting(false);
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
    return (
      <section className="lesson-card completion-card" aria-labelledby="lesson-complete">
        <span className="eyebrow">Lesson complete</span>
        <h2 id="lesson-complete">You can make a first introduction.</h2>
        <p>
          You practised <strong>Me llamo…</strong>, <strong>Soy de…</strong>, and{" "}
          <strong>Encantada</strong>, listened for a place name, and completed a spoken
          introduction. Your transcript, answers, and FSRS review schedule are saved.
        </p>
        <dl className="summary-grid">
          <div><dt>Objectives</dt><dd>{progress.correctAnswers}/{introductionLesson.length}</dd></div>
          <div><dt>Attempts</dt><dd>{progress.attempts}</dd></div>
          <div><dt>Spanish</dt><dd>A1</dd></div>
        </dl>
        {nextReviewAt && (
          <p className="review-note">Latest review scheduled for {new Date(nextReviewAt).toLocaleString()}.</p>
        )}
        {teacherFeedback && <TeacherFeedbackCard feedback={teacherFeedback} />}
        {mistakeMemory && <MistakeMemoryCard memory={mistakeMemory} />}
      </section>
    );
  }

  return (
    <section className="lesson-card" aria-labelledby="exercise-title">
      <div className="lesson-progress" aria-label={`${percent}% complete`}>
        <div className="progress-copy"><span>Today’s lesson</span><span>{percent}%</span></div>
        <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
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
            disabled={submitting}
            onClick={() => {
              if (recognizing) speechProvider.current.stop();
              else void startSpeaking();
            }}
            type="button"
          >
            {recognizing ? "■ Stop listening" : "● Start microphone"}
          </button>
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
              disabled={submitting}
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
        <p className={`feedback ${feedback.correct ? "correct" : "retry"}`} aria-live="polite">
          {feedback.message}
        </p>
      )}
      {teacherFeedback && <TeacherFeedbackCard feedback={teacherFeedback} />}
      {mistakeMemory && <MistakeMemoryCard memory={mistakeMemory} />}
      {loadError && <p className="feedback retry" role="alert">{loadError}</p>}

      <button
        className="primary-button"
        disabled={exercise.speakingTask ? !speechResult || recognizing || submitting : !selectedOption || submitting}
        onClick={exercise.speakingTask ? submitSpeakingAttempt : submitAnswer}
      >
        {submitting ? "Saving…" : exercise.speakingTask ? "Check spoken answer" : "Check answer"}
      </button>
    </section>
  );
}
