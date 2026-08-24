"use client";

import { useSyncExternalStore } from "react";
import { LessonExperience } from "./lesson-experience";
import { OnboardingExperience } from "./onboarding-experience";

const learnerKey = "spanish-coach:learner-id:v1";
const learnerEvent = "spanish-coach:learner-changed";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(learnerEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(learnerEvent, onStoreChange);
  };
}

function getLearnerId() {
  return window.localStorage.getItem(learnerKey) ?? "";
}

export function CoachExperience() {
  const learnerId = useSyncExternalStore(subscribe, getLearnerId, () => "");

  if (!learnerId) {
    return (
      <OnboardingExperience
        onComplete={(id) => {
          window.localStorage.setItem(learnerKey, id);
          window.dispatchEvent(new Event(learnerEvent));
        }}
      />
    );
  }

  return <LessonExperience learnerId={learnerId} />;
}
