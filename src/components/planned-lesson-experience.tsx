"use client";

import { useEffect, useState } from "react";
import { getLessonDefinition } from "@/domain/lesson";
import {
  supportedSessionDurations,
  type LessonPlan,
  type SessionDuration,
} from "@/domain/lesson-planner";
import type { LearnerOverview } from "@/domain/learner-overview";
import type { LessonHistoryEntry } from "@/domain/lesson-history";
import type { PracticeRhythm } from "@/domain/practice-rhythm";
import type { LocalLearnerProfile } from "@/browser/local-learner-profiles";
import { isRecentCompletion, recentCompletionContext, recordJourneyChoice } from "@/browser/learning-journey";
import {
  learnerPrimaryGoalLabels,
  type LearnerPrimaryGoal,
} from "@/domain/learner-profile";
import { LearnerOverviewCard } from "./learner-overview-card";
import { LessonHistoryCard } from "./lesson-history-card";
import { LessonExperience } from "./lesson-experience";
import { PracticeRhythmCard } from "./practice-rhythm-card";
import { ReviewExperience } from "./review-experience";
import type { CoachMode } from "./coach-experience";

type SavedPlan = LessonPlan & { id: string; createdAt: string };
type SavedSession = {
  id: string;
  status: "active" | "completed" | "abandoned";
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
  plan: SavedPlan;
};

type DashboardSection = "today" | "review" | "progress";
const dashboardSections: DashboardSection[] = ["today", "review", "progress"];

export function PlannedLessonExperience({
  learnerId,
  onChangeLearner,
  onLearnerDeleted,
  onLearnerAvailable,
  onLearnerUnavailable,
  onModeChange,
}: {
  learnerId: string;
  onChangeLearner: () => void;
  onLearnerDeleted: () => void;
  onLearnerAvailable: (profile: LocalLearnerProfile) => void;
  onLearnerUnavailable: () => void;
  onModeChange: (mode: CoachMode) => void;
}) {
  const [plan, setPlan] = useState<SavedPlan | null>();
  const [session, setSession] = useState<SavedSession | null>();
  const [overview, setOverview] = useState<LearnerOverview | null>();
  const [historyResult, setHistoryResult] = useState<{
    learnerId: string;
    entries: LessonHistoryEntry[];
  }>();
  const [rhythmResult, setRhythmResult] = useState<{
    learnerId: string;
    rhythm: PracticeRhythm;
  }>();
  const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(10);
  const [changingDuration, setChangingDuration] = useState(false);
  const [creating, setCreating] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string>();
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>("today");
  const [reviewItems, setReviewItems] = useState<LearnerOverview["phrasebook"]>();
  const [recentCompletion, setRecentCompletion] = useState<{
    learnerId: string;
    sessionId: string;
    recordedAt: string;
  }>();

  useEffect(() => {
    if (started || reviewItems) return;
    onModeChange(plan ? "plan" : "dashboard");
  }, [onModeChange, plan, reviewItems, started]);

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
        setSelectedDuration(payload.overview.learner.preferredSessionMinutes);
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

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/learner/history?learnerId=${encodeURIComponent(learnerId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          history?: LessonHistoryEntry[];
          error?: string;
        };
        if (!response.ok || !payload.history) {
          throw new Error(payload.error ?? "Lesson history could not be loaded.");
        }
        setHistoryResult({ learnerId, entries: payload.history });
      })
      .catch((historyError: unknown) => {
        if (historyError instanceof DOMException && historyError.name === "AbortError") return;
        setHistoryResult({ learnerId, entries: [] });
      });
    return () => controller.abort();
  }, [learnerId, overviewRefreshKey]);

  const history = historyResult?.learnerId === learnerId
    ? historyResult.entries
    : undefined;

  useEffect(() => {
    const controller = new AbortController();
    const timezoneOffsetMinutes = new Date().getTimezoneOffset();
    fetch(
      `/api/learner/rhythm?learnerId=${encodeURIComponent(learnerId)}&timezoneOffsetMinutes=${timezoneOffsetMinutes}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload = (await response.json()) as {
          rhythm?: PracticeRhythm;
          error?: string;
        };
        if (!response.ok || !payload.rhythm) {
          throw new Error(payload.error ?? "Practice rhythm could not be loaded.");
        }
        setRhythmResult({ learnerId, rhythm: payload.rhythm });
      })
      .catch((rhythmError: unknown) => {
        if (rhythmError instanceof DOMException && rhythmError.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [learnerId, overviewRefreshKey]);

  const rhythm = rhythmResult?.learnerId === learnerId
    ? rhythmResult.rhythm
    : undefined;

  function moveDashboardTab(current: DashboardSection, direction: -1 | 1) {
    const currentIndex = dashboardSections.indexOf(current);
    const nextSection = dashboardSections[
      (currentIndex + direction + dashboardSections.length) % dashboardSections.length
    ];
    selectDashboardSection(nextSection);
    requestAnimationFrame(() => document.getElementById(`dashboard-tab-${nextSection}`)?.focus());
  }

  function selectDashboardSection(section: DashboardSection) {
    if (section === "review" && dashboardSection !== "review") {
      const latestCompletion = history?.[0];
      const recentHistorySessionId = latestCompletion
        && isRecentCompletion(latestCompletion.completedAt)
        ? latestCompletion.sessionId
        : undefined;
      const sessionId = recentCompletion?.learnerId === learnerId
        && isRecentCompletion(recentCompletion.recordedAt)
        ? recentCompletion.sessionId
        : recentHistorySessionId;
      if (sessionId) {
        void recordJourneyChoice({ learnerId, sessionId, choice: "review" });
      }
    }
    setDashboardSection(section);
  }

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
      onModeChange("plan");
      return true;
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : "The lesson plan could not be created.");
      return false;
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

  async function updateLearnerPreferences(preferences: {
    primaryGoal: LearnerPrimaryGoal;
    preferredSessionMinutes: SessionDuration;
  }) {
    const response = await fetch("/api/learner/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId, ...preferences }),
    });
    const payload = (await response.json()) as {
      learner?: {
        primaryGoal: LearnerPrimaryGoal;
        preferredSessionMinutes: SessionDuration;
      };
      error?: string;
    };
    if (!response.ok || !payload.learner) {
      throw new Error(payload.error ?? "Learning preferences could not be updated.");
    }
    const learner = payload.learner;

    setOverview((current) => current ? {
      ...current,
      learner: {
        ...current.learner,
        primaryGoal: learner.primaryGoal,
        preferredSessionMinutes: learner.preferredSessionMinutes,
      },
    } : current);
    setSelectedDuration(learner.preferredSessionMinutes);
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
      onModeChange("lesson");
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
    onModeChange("dashboard");
  }

  async function finishLesson(destination: "next" | "dashboard") {
    const completedSessionId = session?.id;
    if (destination === "next") {
      const nextPlanReady = await createPlan();
      if (!nextPlanReady) return false;
      if (completedSessionId) {
        setRecentCompletion(recentCompletionContext(learnerId, completedSessionId));
        void recordJourneyChoice({ learnerId, sessionId: completedSessionId, choice: "next_lesson" });
      }
      setStarted(false);
      setSession(null);
      setOverviewRefreshKey((value) => value + 1);
      onModeChange("plan");
      return true;
    }

    if (completedSessionId) setRecentCompletion(recentCompletionContext(learnerId, completedSessionId));
    setStarted(false);
    setSession(null);
    setPlan(null);
    setOverviewRefreshKey((value) => value + 1);
    onModeChange("dashboard");
    return true;
  }

  if (plan === undefined) {
    return <div className="lesson-card loading-card">Checking what is useful today…</div>;
  }

  if (!plan) {
    const dueReviewCount = overview?.dueReviewCount ?? 0;
    const nextLessonTitle = overview?.nextLesson.title ?? "your next A1 topic";
    const nextLessonObjective = overview?.nextLesson.objective
      ?? "The coach will choose the most useful next step from your saved progress.";

    return (
      <>
      <section className="lesson-card planner-card" aria-labelledby="planner-title" hidden={Boolean(reviewItems)}>
        <span className="eyebrow">Today</span>
        <h2 id="planner-title">
          {overview ? `Ready for ${selectedDuration} minutes, ${overview.learner.displayName}?` : "Preparing today’s practice…"}
        </h2>
        <p className="support-copy">Your coach uses saved progress to choose what is most useful next.</p>

        <div className="dashboard-tabs" role="tablist" aria-label="Learning dashboard">
          {dashboardSections.map((section) => (
            <button
              key={section}
              id={`dashboard-tab-${section}`}
              type="button"
              role="tab"
              aria-selected={dashboardSection === section}
              aria-controls={`dashboard-panel-${section}`}
              tabIndex={dashboardSection === section ? 0 : -1}
              onClick={() => selectDashboardSection(section)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveDashboardTab(section, 1);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveDashboardTab(section, -1);
                } else if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  const destination = event.key === "Home" ? "today" : "progress";
                  selectDashboardSection(destination);
                  requestAnimationFrame(() => document.getElementById(`dashboard-tab-${destination}`)?.focus());
                }
              }}
            >
              {section === "today" ? "Today" : section === "review" ? "Review" : "Progress"}
              {section === "review" && dueReviewCount > 0 && <span>{dueReviewCount}</span>}
            </button>
          ))}
        </div>

        {dashboardSection === "today" && (
          <div id="dashboard-panel-today" role="tabpanel" aria-labelledby="dashboard-tab-today">
            <section className="today-focus" aria-labelledby="today-focus-title">
              <div className="today-focus-copy">
                <span className="today-label">Next conversation topic</span>
                <h3 id="today-focus-title">{nextLessonTitle}</h3>
                <p>{nextLessonObjective}</p>
              </div>
              <dl className="today-snapshot" aria-label="Today’s lesson snapshot">
                <div><dt>Time</dt><dd>{selectedDuration} min</dd></div>
                <div><dt>Level</dt><dd>A1</dd></div>
                <div><dt>Skills</dt><dd>Listen + speak</dd></div>
              </dl>
            </section>

            <div className="today-actions">
              <button className="primary-button" disabled={creating || !overview} onClick={createPlan}>
                {creating ? "Building today’s lesson…" : "Build today’s lesson"}
              </button>
              <button
                className="text-button"
                type="button"
                aria-expanded={changingDuration}
                aria-controls="today-duration-options"
                onClick={() => setChangingDuration((value) => !value)}
              >
                {changingDuration ? "Keep this practice window" : `Change practice window · up to ${selectedDuration} min`}
              </button>
            </div>

            {changingDuration && (
              <div id="today-duration-options" className="duration-options planner-durations" aria-label="Available practice time">
                {supportedSessionDurations.map((duration) => (
                  <button
                    key={duration}
                    className={selectedDuration === duration ? "chosen" : ""}
                    aria-pressed={selectedDuration === duration}
                    onClick={() => setSelectedDuration(duration)}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            )}
            {changingDuration && <p className="provider-note">The core lesson usually takes about 5–8 minutes. A longer window adds due phrase reviews when available; it does not yet add a full 30-minute lesson.</p>}

            {overview && (
              <details className="today-reasons">
                <summary>Why this is useful today</summary>
                <ul>
                  <li>Continue with {nextLessonTitle} from your current A1 path.</li>
                  <li>
                    {dueReviewCount > 0
                      ? `Include ${dueReviewCount} due review${dueReviewCount === 1 ? "" : "s"} before they fade.`
                      : "Keep review light because nothing is due right now."}
                  </li>
                  <li>Practise listening and speaking in the same short session.</li>
                </ul>
              </details>
            )}
          </div>
        )}

        {error && <p className="feedback retry" role="alert">{error}</p>}
        {overview && dashboardSection === "review" && (
          <div id="dashboard-panel-review" role="tabpanel" aria-labelledby="dashboard-tab-review">
            <LearnerOverviewCard
              overview={overview}
              view="review"
              showProfile={false}
              onStartReview={(items) => {
                setReviewItems(items);
                onModeChange("review");
              }}
              onChangeLearner={onChangeLearner}
              onDeleteLearner={deleteLearner}
              onRenameLearner={renameLearner}
              onUpdatePreferences={updateLearnerPreferences}
            />
          </div>
        )}
        {overview && dashboardSection === "progress" && (
          <div id="dashboard-panel-progress" role="tabpanel" aria-labelledby="dashboard-tab-progress">
            <LearnerOverviewCard
              overview={overview}
              view="progress"
              showProfile={false}
              onChangeLearner={onChangeLearner}
              onDeleteLearner={deleteLearner}
              onRenameLearner={renameLearner}
              onUpdatePreferences={updateLearnerPreferences}
            />
            {rhythm && <PracticeRhythmCard rhythm={rhythm} />}
            {history && history.length > 0 && <LessonHistoryCard history={history} />}
          </div>
        )}
        {overview && (
          <LearnerOverviewCard
            overview={overview}
            view="profile"
            onChangeLearner={onChangeLearner}
            onDeleteLearner={deleteLearner}
            onRenameLearner={renameLearner}
            onUpdatePreferences={updateLearnerPreferences}
          />
        )}
      </section>
      {reviewItems && (
        <ReviewExperience
          items={reviewItems}
          onBackToReview={() => {
            setReviewItems(undefined);
            setDashboardSection("review");
            onModeChange("dashboard");
            requestAnimationFrame(() => document.getElementById("phrasebook-review-start")?.focus());
          }}
          onReturnToToday={() => {
            setReviewItems(undefined);
            setDashboardSection("today");
            onModeChange("dashboard");
            requestAnimationFrame(() => document.getElementById("dashboard-tab-today")?.focus());
          }}
        />
      )}
      </>
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
        onFinishLesson={finishLesson}
        onModeChange={onModeChange}
      />
    );
  }

  const plannedLesson = getLessonDefinition(plan.lessonKey);

  return (
    <section className="lesson-card planner-card" aria-labelledby="plan-title">
      <span className="eyebrow">Today’s adaptive plan · up to {plan.targetMinutes} min available</span>
      <h2 id="plan-title">Ready for “{plannedLesson?.title ?? "your next lesson"}”?</h2>
      <p className="plan-objective">{plannedLesson?.objective ?? plan.goalFocus}</p>
      <p className="provider-note">The {plannedLesson?.exercises.length ?? 0}-step core lesson usually takes about 5–8 minutes{plan.reviewExercises.length > 0 ? `, plus ${plan.reviewExercises.length} due phrase review${plan.reviewExercises.length === 1 ? "" : "s"}` : ""}. The longer window is not a promise of a longer lesson yet.</p>
      <div className="plan-primary-actions">
        <button className="primary-button" disabled={creating} onClick={startLesson}>
          {creating ? "Starting your lesson…" : "Start the ready practice"}
        </button>
      </div>
      <details className="plan-details">
        <summary>See why this lesson was chosen and what it includes</summary>
        <aside className="goal-focus-note" aria-label="Learning goal alignment">
          <span>
            {plan.primaryGoal
              ? `Your goal · ${learnerPrimaryGoalLabels[plan.primaryGoal]}`
              : "Personal learning focus"}
          </span>
          <p>{plan.goalFocus}</p>
        </aside>
        <section className="plan-explanation" aria-labelledby="plan-explanation-title">
          <h3 id="plan-explanation-title">Why this plan fits today</h3>
          <ul>
            {plan.adaptationReasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </section>
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
      </details>
      <div className="plan-secondary-actions">
        <button className="text-button" onClick={() => setPlan(null)}>Choose another duration</button>
        <button className="text-button" onClick={onChangeLearner}>Change learner</button>
      </div>
    </section>
  );
}
