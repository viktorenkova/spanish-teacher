"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { diagnosticQuestions } from "@/domain/diagnostic";
import type { LocalLearnerProfile } from "@/browser/local-learner-profiles";
import {
  learnerPrimaryGoalLabels,
  learnerPrimaryGoals,
  type LearnerPrimaryGoal,
} from "@/domain/learner-profile";
import { supportedSessionDurations } from "@/domain/lesson-planner";
import {
  clearOnboardingDraft,
  getOnboardingDraftSnapshot,
  parseOnboardingDraft,
  saveOnboardingDraft,
  subscribeToOnboardingDraft,
  type OnboardingDraft,
} from "@/browser/onboarding-draft";

type OnboardingExperienceProps = {
  notice?: string;
  onCancel?: () => void;
  onComplete: (profile: LocalLearnerProfile) => void;
  onStepChange?: (step: "profile" | "diagnostic") => void;
};

function subscribeToHydration() {
  return () => undefined;
}

function getHydratedSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function OnboardingExperience({ notice, onCancel, onComplete, onStepChange }: OnboardingExperienceProps) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );
  const draftSnapshot = useSyncExternalStore(
    subscribeToOnboardingDraft,
    getOnboardingDraftSnapshot,
    () => null,
  );
  const draft = parseOnboardingDraft(draftSnapshot);
  const { step, displayName, primaryGoal, priorExperience, preferredSessionMinutes, answers } = draft;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  function updateDraft(changes: Partial<OnboardingDraft>) {
    saveOnboardingDraft({ ...draft, ...changes });
  }

  useEffect(() => {
    if (hydrated) onStepChange?.(step);
  }, [hydrated, onStepChange, step]);

  async function submitDiagnostic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(answers).length !== diagnosticQuestions.length) {
      setError("Please answer all four questions.");
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          primaryGoal,
          priorExperience,
          preferredSessionMinutes,
          answers,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        learner?: { id: string; displayName: string };
      };
      if (!response.ok || !payload.learner) {
        throw new Error(payload.error ?? "The profile could not be saved.");
      }
      clearOnboardingDraft();
      onComplete({
        learnerId: payload.learner.id,
        displayName: payload.learner.displayName,
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "The profile could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "profile") {
    return (
      <section className="lesson-card onboarding-card" aria-labelledby="onboarding-title">
        <span className="eyebrow">Step 1 of 2 · Your starting point</span>
        <h2 id="onboarding-title">Let the coach plan for you.</h2>
        <p className="support-copy">
          Your Spanish starts at A1. English B1 is used only for clear support and explanations.
        </p>
        {notice && <p className="profile-recovery-notice" role="status">{notice}</p>}
        {onCancel && (
          <button className="text-button onboarding-cancel" type="button" onClick={onCancel}>
            Back to saved profiles
          </button>
        )}
        <form
          className="profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (displayName.trim()) {
              updateDraft({ step: "diagnostic" });
              onStepChange?.("diagnostic");
            }
          }}
        >
          <label>
            What should the coach call you?
            <input
              required
              disabled={!hydrated}
              maxLength={80}
              value={displayName}
              onChange={(event) => updateDraft({ displayName: event.target.value })}
              placeholder="Your name"
            />
          </label>
          <button className="primary-button" type="submit" disabled={!hydrated}>Continue to a short check</button>
          <details className="onboarding-preferences">
            <summary>Personalise your plan (optional)</summary>
            <div className="onboarding-preferences-fields">
              <label>
                Your main goal
                <select
                  disabled={!hydrated}
                  value={primaryGoal}
                  onChange={(event) => updateDraft({ primaryGoal: event.target.value as LearnerPrimaryGoal })}
                >
                  {learnerPrimaryGoals.map((goal) => (
                    <option key={goal} value={goal}>{learnerPrimaryGoalLabels[goal]}</option>
                  ))}
                </select>
              </label>
              <label>
                Previous Spanish experience
                <select disabled={!hydrated} value={priorExperience} onChange={(event) => updateDraft({ priorExperience: event.target.value as OnboardingDraft["priorExperience"] })}>
                  <option value="new">Almost completely new</option>
                  <option value="some-basics">I know some basic Spanish</option>
                  <option value="returning">I am returning after a break</option>
                </select>
              </label>
              <fieldset>
                <legend>Preferred lesson length</legend>
                <div className="duration-options">
                  {supportedSessionDurations.map((minutes) => (
                    <label key={minutes} className={preferredSessionMinutes === minutes ? "chosen" : ""}>
                      <input
                        type="radio"
                        name="duration"
                        disabled={!hydrated}
                        checked={preferredSessionMinutes === minutes}
                        onChange={() => updateDraft({ preferredSessionMinutes: minutes })}
                      />
                      {minutes} min
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </details>
          <button className="text-button" type="button" onClick={clearOnboardingDraft}>Start over</button>
        </form>
      </section>
    );
  }

  return (
    <section className="lesson-card onboarding-card" aria-labelledby="diagnostic-title">
      <span className="eyebrow">Step 2 of 2 · Short A1 check</span>
      <h2 id="diagnostic-title">Show what is already familiar.</h2>
      <p className="support-copy">
        Four quick questions, with no pass or fail. They help place you within A1. Speaking and listening will be checked later with real audio.
      </p>
      <form className="diagnostic-form" onSubmit={submitDiagnostic}>
        {diagnosticQuestions.map((question, index) => (
          <fieldset key={question.id}>
            <legend><span>{index + 1}</span>{question.prompt}</legend>
            <div className="diagnostic-options">
              {question.options.map((option) => (
                <label key={option.id} className={answers[question.id] === option.id ? "chosen" : ""}>
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => updateDraft({ answers: { ...answers, [question.id]: option.id } })}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {error && <p className="feedback retry" role="alert">{error}</p>}
        <div className="form-actions">
          <button
            className="text-button"
            type="button"
            onClick={() => {
              updateDraft({ step: "profile" });
              onStepChange?.("profile");
            }}
          >
            Back
          </button>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Saving your profile…" : "Create my learning plan"}
          </button>
          <button className="text-button" type="button" onClick={() => {
            clearOnboardingDraft();
            onStepChange?.("profile");
          }}>Start over</button>
        </div>
      </form>
    </section>
  );
}
