"use client";

import { useEffect, useMemo, useState } from "react";
import { createEmptyProgress, introductionLesson, type LessonProgress } from "@/domain/lesson";

type LessonExperienceProps = {
  learnerId: string;
};

type AttemptResponse = {
  correct: boolean;
  feedback: string;
  nextReviewAt: string;
  progress: LessonProgress;
};

export function LessonExperience({ learnerId }: LessonExperienceProps) {
  const [progress, setProgress] = useState<LessonProgress>();
  const [selectedOption, setSelectedOption] = useState<string>();
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>();
  const [nextReviewAt, setNextReviewAt] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string>();
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

    return () => controller.abort();
  }, [learnerId, reloadKey]);

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
          <strong>Encantada</strong>. Your answers and FSRS review schedule are saved.
        </p>
        <dl className="summary-grid">
          <div><dt>Objectives</dt><dd>{progress.correctAnswers}/3</dd></div>
          <div><dt>Attempts</dt><dd>{progress.attempts}</dd></div>
          <div><dt>Spanish</dt><dd>A1</dd></div>
        </dl>
        {nextReviewAt && (
          <p className="review-note">Latest review scheduled for {new Date(nextReviewAt).toLocaleString()}.</p>
        )}
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

      {feedback && (
        <p className={`feedback ${feedback.correct ? "correct" : "retry"}`} aria-live="polite">
          {feedback.message}
        </p>
      )}
      {loadError && <p className="feedback retry" role="alert">{loadError}</p>}

      <button
        className="primary-button"
        disabled={!selectedOption || submitting}
        onClick={submitAnswer}
      >
        {submitting ? "Saving…" : "Check answer"}
      </button>
    </section>
  );
}
