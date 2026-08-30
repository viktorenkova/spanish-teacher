"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { diagnosticQuestions } from "@/domain/diagnostic";

type OnboardingExperienceProps = {
  notice?: string;
  onComplete: (learnerId: string) => void;
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

export function OnboardingExperience({ notice, onComplete }: OnboardingExperienceProps) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );
  const [step, setStep] = useState<"profile" | "diagnostic">("profile");
  const [displayName, setDisplayName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("conversation");
  const [priorExperience, setPriorExperience] = useState("some-basics");
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState(10);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

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
        learner?: { id: string };
      };
      if (!response.ok || !payload.learner) {
        throw new Error(payload.error ?? "The profile could not be saved.");
      }
      onComplete(payload.learner.id);
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
        <form
          className="profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (displayName.trim()) setStep("diagnostic");
          }}
        >
          <label>
            What should the coach call you?
            <input
              required
              disabled={!hydrated}
              maxLength={80}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
            />
          </label>
          <label>
            Your main goal
            <select disabled={!hydrated} value={primaryGoal} onChange={(event) => setPrimaryGoal(event.target.value)}>
              <option value="conversation">Speak in everyday conversations</option>
              <option value="travel">Use Spanish while travelling</option>
              <option value="daily-life">Build a steady daily habit</option>
            </select>
          </label>
          <label>
            Previous Spanish experience
            <select disabled={!hydrated} value={priorExperience} onChange={(event) => setPriorExperience(event.target.value)}>
              <option value="new">Almost completely new</option>
              <option value="some-basics">I know some basic Spanish</option>
              <option value="returning">I am returning after a break</option>
            </select>
          </label>
          <fieldset>
            <legend>Preferred lesson length</legend>
            <div className="duration-options">
              {[5, 10, 15, 20, 30].map((minutes) => (
                <label key={minutes} className={preferredSessionMinutes === minutes ? "chosen" : ""}>
                  <input
                    type="radio"
                    name="duration"
                    disabled={!hydrated}
                    checked={preferredSessionMinutes === minutes}
                    onChange={() => setPreferredSessionMinutes(minutes)}
                  />
                  {minutes} min
                </label>
              ))}
            </div>
          </fieldset>
          <button className="primary-button" type="submit" disabled={!hydrated}>Continue to a short check</button>
        </form>
      </section>
    );
  }

  return (
    <section className="lesson-card onboarding-card" aria-labelledby="diagnostic-title">
      <span className="eyebrow">Step 2 of 2 · Short A1 check</span>
      <h2 id="diagnostic-title">Show what is already familiar.</h2>
      <p className="support-copy">
        This is not an exam. It only places you within A1. Speaking and listening will be checked later with real audio.
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
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {error && <p className="feedback retry" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="text-button" type="button" onClick={() => setStep("profile")}>Back</button>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Saving your profile…" : "Create my learning plan"}
          </button>
        </div>
      </form>
    </section>
  );
}
