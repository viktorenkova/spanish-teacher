"use client";

import { useEffect, useState } from "react";
import {
  supportedSessionDurations,
  type LessonPlan,
  type SessionDuration,
} from "@/domain/lesson-planner";
import { LessonExperience } from "./lesson-experience";

type SavedPlan = LessonPlan & { id: string; createdAt: string };

export function PlannedLessonExperience({ learnerId }: { learnerId: string }) {
  const [plan, setPlan] = useState<SavedPlan | null>();
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(10);
  const [creating, setCreating] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/lesson/plan?learnerId=${encodeURIComponent(learnerId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as { plan?: SavedPlan | null; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "The lesson plan could not be loaded.");
        return payload.plan ?? null;
      })
      .then(setPlan)
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "The lesson plan could not be loaded.");
        setPlan(null);
      });
    return () => controller.abort();
  }, [learnerId]);

  async function createPlan() {
    setCreating(true);
    setError(undefined);
    try {
      const response = await fetch("/api/lesson/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, targetMinutes: selectedDuration }),
      });
      const payload = (await response.json()) as { plan?: SavedPlan; error?: string };
      if (!response.ok || !payload.plan) {
        throw new Error(payload.error ?? "The lesson plan could not be created.");
      }
      setPlan(payload.plan);
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : "The lesson plan could not be created.");
    } finally {
      setCreating(false);
    }
  }

  if (plan === undefined) {
    return <div className="lesson-card loading-card">Checking what is useful today…</div>;
  }

  if (!plan) {
    return (
      <section className="lesson-card planner-card" aria-labelledby="planner-title">
        <span className="eyebrow">Plan today’s lesson</span>
        <h2 id="planner-title">How much time do you have?</h2>
        <p className="support-copy">
          The coach will balance due reviews, new A1 language, listening, and mandatory speaking.
        </p>
        <div className="duration-options planner-durations" aria-label="Lesson duration">
          {supportedSessionDurations.map((duration) => (
            <button
              key={duration}
              className={selectedDuration === duration ? "chosen" : ""}
              onClick={() => setSelectedDuration(duration)}
            >
              {duration} min
            </button>
          ))}
        </div>
        {error && <p className="feedback retry" role="alert">{error}</p>}
        <button className="primary-button" disabled={creating} onClick={createPlan}>
          {creating ? "Building your lesson…" : "Build my lesson"}
        </button>
      </section>
    );
  }

  if (started) {
    return (
      <LessonExperience
        learnerId={learnerId}
        planId={plan.id}
        lessonKey={plan.lessonKey}
        reviewExercises={plan.reviewExercises}
        onPlanNextLesson={() => {
          setStarted(false);
          setPlan(null);
        }}
      />
    );
  }

  return (
    <section className="lesson-card planner-card" aria-labelledby="plan-title">
      <span className="eyebrow">Today’s adaptive plan · {plan.estimatedMinutes} min</span>
      <h2 id="plan-title">A coherent path, chosen for you.</h2>
      <ol className="plan-blocks">
        {plan.blocks.map((block) => (
          <li key={block.id}>
            <span className={`plan-kind ${block.availability}`}>{block.kind}</span>
            <div>
              <strong>{block.title}</strong>
              <p>{block.objective}</p>
            </div>
            <small>{Math.max(1, Math.round(block.estimatedSeconds / 60))} min</small>
          </li>
        ))}
      </ol>
      <p className="provider-note">
        {plan.reviewExercises.length > 0
          ? `${plan.reviewExercises.length} personalised review${plan.reviewExercises.length === 1 ? " is" : "s are"} ready before the core listening and speaking practice.`
          : "Core listening and speaking are ready. Extended provider-pending blocks are shown but not scored yet."}
      </p>
      <div className="form-actions">
        <button className="text-button" onClick={() => setPlan(null)}>Choose another duration</button>
        <button className="primary-button" onClick={() => setStarted(true)}>Start the ready practice</button>
      </div>
    </section>
  );
}
