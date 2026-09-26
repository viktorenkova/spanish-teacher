import { diagnosticQuestions } from "../domain/diagnostic";
import { learnerPrimaryGoals, type LearnerPrimaryGoal } from "../domain/learner-profile";
import { supportedSessionDurations } from "../domain/lesson-planner";

export type OnboardingDraft = {
  step: "profile" | "diagnostic";
  displayName: string;
  primaryGoal: LearnerPrimaryGoal;
  priorExperience: "new" | "some-basics" | "returning";
  preferredSessionMinutes: number;
  answers: Record<string, string>;
};

const storageKey = "spanish-coach:onboarding-draft:v1";
const changeEvent = "spanish-coach:onboarding-draft-change";
const emptyDraft: OnboardingDraft = {
  step: "profile",
  displayName: "",
  primaryGoal: "conversation",
  priorExperience: "some-basics",
  preferredSessionMinutes: 10,
  answers: {},
};

export function parseOnboardingDraft(snapshot: string | null): OnboardingDraft {
  if (!snapshot) return emptyDraft;
  try {
    const value = JSON.parse(snapshot) as Partial<OnboardingDraft>;
    if (!value || typeof value !== "object") return emptyDraft;
    const answers: Record<string, string> = {};
    for (const question of diagnosticQuestions) {
      const selected = value.answers?.[question.id];
      if (selected && question.options.some((option) => option.id === selected)) answers[question.id] = selected;
    }
    return {
      step: value.step === "diagnostic" ? "diagnostic" : "profile",
      displayName: typeof value.displayName === "string" ? value.displayName.slice(0, 80) : "",
      primaryGoal: learnerPrimaryGoals.includes(value.primaryGoal as LearnerPrimaryGoal)
        ? value.primaryGoal as LearnerPrimaryGoal : "conversation",
      priorExperience: value.priorExperience === "new" || value.priorExperience === "returning"
        ? value.priorExperience : "some-basics",
      preferredSessionMinutes: supportedSessionDurations.includes(value.preferredSessionMinutes as 5 | 10 | 15 | 20 | 30)
        ? value.preferredSessionMinutes as number : 10,
      answers,
    };
  } catch {
    return emptyDraft;
  }
}

export function getOnboardingDraftSnapshot() {
  try { return window.localStorage.getItem(storageKey); }
  catch { return null; }
}

export function subscribeToOnboardingDraft(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function saveOnboardingDraft(draft: OnboardingDraft) {
  try { window.localStorage.setItem(storageKey, JSON.stringify(draft)); }
  catch { return; }
  window.dispatchEvent(new Event(changeEvent));
}

export function clearOnboardingDraft() {
  try { window.localStorage.removeItem(storageKey); }
  catch { return; }
  window.dispatchEvent(new Event(changeEvent));
}
