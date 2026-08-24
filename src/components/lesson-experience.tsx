"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  createEmptyProgress,
  introductionLesson,
  recordAnswer,
  type LessonProgress,
} from "@/domain/lesson";

const storageKey = "spanish-coach:introduction-progress:v1";
const progressEvent = "spanish-coach:progress-changed";
const emptyProgressSnapshot = JSON.stringify(createEmptyProgress());

function subscribeToProgress(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(progressEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(progressEvent, onStoreChange);
  };
}

function getProgressSnapshot() {
  return window.localStorage.getItem(storageKey) ?? emptyProgressSnapshot;
}

function readProgress(snapshot: string): LessonProgress {
  try {
    return JSON.parse(snapshot) as LessonProgress;
  } catch {
    return createEmptyProgress();
  }
}

function saveProgress(progress: LessonProgress) {
  window.localStorage.setItem(storageKey, JSON.stringify(progress));
  window.dispatchEvent(new Event(progressEvent));
}

export function LessonExperience() {
  const progressSnapshot = useSyncExternalStore(
    subscribeToProgress,
    getProgressSnapshot,
    () => emptyProgressSnapshot,
  );
  const progress = useMemo(() => readProgress(progressSnapshot), [progressSnapshot]);
  const [selectedOption, setSelectedOption] = useState<string>();
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>();

  const exercise = useMemo(
    () => introductionLesson.find((item) => !progress.completedExerciseIds.includes(item.id)),
    [progress.completedExerciseIds],
  );
  const percent = Math.round((progress.completedExerciseIds.length / introductionLesson.length) * 100);

  function submitAnswer() {
    if (!exercise || !selectedOption) return;
    const correct = selectedOption === exercise.correctOptionId;
    saveProgress(recordAnswer(progress, exercise, selectedOption));
    setFeedback({
      correct,
      message: correct ? exercise.successFeedback : exercise.retryFeedback,
    });
    if (correct) {
      window.setTimeout(() => {
        setSelectedOption(undefined);
        setFeedback(undefined);
      }, 1100);
    }
  }

  function restartLesson() {
    saveProgress(createEmptyProgress());
    setSelectedOption(undefined);
    setFeedback(undefined);
  }

  if (!exercise) {
    return (
      <section className="lesson-card completion-card" aria-labelledby="lesson-complete">
        <span className="eyebrow">Lesson complete</span>
        <h2 id="lesson-complete">You can make a first introduction.</h2>
        <p>
          You practised <strong>Me llamo…</strong>, <strong>Soy de…</strong>, and{" "}
          <strong>Encantada</strong>. Speaking and spaced review arrive in the next slices.
        </p>
        <dl className="summary-grid">
          <div><dt>Objectives</dt><dd>{progress.correctAnswers}/3</dd></div>
          <div><dt>Attempts</dt><dd>{progress.attempts}</dd></div>
          <div><dt>Spanish</dt><dd>A1</dd></div>
        </dl>
        <button className="secondary-button" onClick={restartLesson}>Practise again</button>
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

      <div className="options" role="radiogroup" aria-label="Answer choices">
        {exercise.options.map((option) => (
          <button
            className={`option ${selectedOption === option.id ? "selected" : ""}`}
            key={option.id}
            role="radio"
            aria-checked={selectedOption === option.id}
            onClick={() => {
              setSelectedOption(option.id);
              setFeedback(undefined);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {feedback && (
        <p className={`feedback ${feedback.correct ? "correct" : "retry"}`} aria-live="polite">
          {feedback.message}
        </p>
      )}

      <button className="primary-button" disabled={!selectedOption} onClick={submitAnswer}>
        Check answer
      </button>
    </section>
  );
}
