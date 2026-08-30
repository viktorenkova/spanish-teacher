"use client";

import { useEffect, useState } from "react";
import {
  supportedSessionDurations,
  type LessonPlan,
  type SessionDuration,
} from "@/domain/lesson-planner";
import type { LearnerOverview } from "@/domain/learner-overview";
import type { LocalLearnerProfile } from "@/browser/local-learner-profiles";
import { LearnerOverviewCard } from "./learner-overview-card";
import { LessonExperience } from "./lesson-experience";

type SavedPlan = LessonPlan & { id: string; createdAt: string };
type SavedSession = {
  id: string;
  status: "active" | "completed" | "abandoned";
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
  plan: SavedPlan;
};

export function PlannedLessonExperience({
  learnerId,
  onChangeLearner,
  onLearnerDeleted,
  onLearnerAvailable,
  onLearnerUnavailable,
}: {
  learnerId: string;
  onChangeLearner: () => void;
  onLearnerDeleted: () => void;
  onLearnerAvailable: (profile: LocalLearnerProfile) => void;
  onLearnerUnavailable: () => void;
}) {
  const [plan, setPlan] = useState<SavedPlan | null>();
  const [session, setSession] = useState<SavedSession | null>();
  const [overview, setOverview] = useState<LearnerOverview | null>();
  const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(10);
  const [creating, setCreating] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    async function loadExperience() {
      try {
        const sessionResponse = await fetch(
          `/api/lesson/sessions?learnerId=${encodeURIComponent(learnerId)}`,
          { signal: controller.signal },
        );
        const sessionPayload = (await sessionResponse.json()) as {
          session?: SavedSession | null;
          error?: string;
        };
        if (!sessionResponse.ok) {
          throw new Error(sessionPayload.error ?? "The active lesson could not be loaded.");
        }
        if (sessionPayload.session) {
          setSession(sessionPayload.session);
          setPlan(sessionPayload.session.plan);
          setStarted(true);
          return;
        }

        const planResponse = await fetch(
          `/api/lesson/plan?learnerId=${encodeURIComponent(learnerId)}`,
          { signal: controller.signal },
        );
        const planPayload = (await planResponse.json()) as {
          plan?: SavedPlan | null;
          error?: string;
        };
        if (!planResponse.ok) {
          throw new Error(planPayload.error ?? "The lesson plan could not be loaded.");
        }
        setSession(null);
        setPlan(planPayload.plan ?? null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "The lesson plan could not be loaded.");
        setPlan(null);
      }
    }
    void loadExperience();
    return () => controller.abort();
  }, [learnerId]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/learner/overview?learnerId=${encodeURIComponent(learnerId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          overview?: LearnerOverview;
          error?: string;
        };
        if (response.status === 400 || response.status === 404) {
          onLearnerUnavailable();
          return;
        }
        if (!response.ok || !payload.overview) {
          throw new Error(payload.error ?? "Saved progress could not be loaded.");
        }
        setOverview(payload.overview);
        onLearnerAvailable({
          learnerId,
          displayName: payload.overview.learner.displayName,
        });
      })
      .catch((overviewError: unknown) => {
        if (overviewError instanceof DOMException && overviewError.name === "AbortError") return;
        setOverview(null);
      });
    return () => controller.abort();
  }, [learnerId, onLearnerAvailable, onLearnerUnavailable, overviewRefreshKey]);

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
      setSession(null);
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : "The lesson plan could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function renameLearner(displayName: string) {
    const response = await fetch("/api/learner/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId, displayName }),
    });
    const payload = (await response.json()) as {
      learner?: { id: string; displayName: string };
      error?: string;
    };
    if (!response.ok || !payload.learner) {
      throw new Error(payload.error ?? "The learner name could not be updated.");
    }
    const learner = payload.learner;

    setOverview((current) => current ? {
      ...current,
      learner: { ...current.learner, displayName: learner.displayName },
    } : current);
    onLearnerAvailable({ learnerId, displayName: learner.displayName });
  }

  async function deleteLearner(confirmationDisplayName: string) {
    const response = await fetch("/api/learner/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId, confirmationDisplayName }),
    });
    const payload = (await response.json()) as { deleted?: boolean; error?: string };
    if (!response.ok || !payload.deleted) {
      throw new Error(payload.error ?? "The learner profile could not be deleted.");
    }
    onLearnerDeleted();
  }

  async function startLesson() {
    if (!plan || creating) return;
    setCreating(true);
    setError(undefined);
    try {
      const response = await fetch("/api/lesson/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, planId: plan.id }),
      });
      const payload = (await response.json()) as { session?: SavedSession; error?: string };
      if (!response.ok || !payload.session) {
        throw new Error(payload.error ?? "The lesson could not be started.");
      }
      setSession(payload.session);
      setPlan(payload.session.plan);
      setStarted(true);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "The lesson could not be started.");
    } finally {
      setCreating(false);
    }
  }

  async function endLesson() {
    if (!session) return;
    const response = await fetch("/api/lesson/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "abandon",
        learnerId,
        sessionId: session.id,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "The lesson could not be ended safely.");
    }
    setStarted(false);
    setSession(null);
    setPlan(null);
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
        {overview && (
          <LearnerOverviewCard
            overview={overview}
            onChangeLearner={onChangeLearner}
            onDeleteLearner={deleteLearner}
            onRenameLearner={renameLearner}
          />
        )}
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

  if (started && session) {
    return (
      <LessonExperience
        learnerId={learnerId}
        planId={plan.id}
        sessionId={session.id}
        lessonKey={plan.lessonKey}
        reviewExercises={plan.reviewExercises}
        onEndLesson={endLesson}
        onFinishLesson={() => {
          setStarted(false);
          setSession(null);
          setPlan(null);
          setOverviewRefreshKey((value) => value + 1);
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
        <button className="text-button" onClick={onChangeLearner}>Change learner</button>
        <button className="primary-button" disabled={creating} onClick={startLesson}>
          {creating ? "Starting your lesson…" : "Start the ready practice"}
        </button>
      </div>
    </section>
  );
}
