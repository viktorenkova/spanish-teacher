"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { OnboardingExperience } from "./onboarding-experience";
import { PlannedLessonExperience } from "./planned-lesson-experience";

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
  const [recoveryNotice, setRecoveryNotice] = useState<string>();

  const recoverMissingLearner = useCallback(() => {
    window.localStorage.removeItem(learnerKey);
    setRecoveryNotice(
      "The saved profile could not be found. Create a new local profile to continue.",
    );
    window.dispatchEvent(new Event(learnerEvent));
  }, []);

  if (!learnerId) {
    return (
      <OnboardingExperience
        notice={recoveryNotice}
        onComplete={(id) => {
          window.localStorage.setItem(learnerKey, id);
          setRecoveryNotice(undefined);
          window.dispatchEvent(new Event(learnerEvent));
        }}
      />
    );
  }

  return (
    <PlannedLessonExperience
      learnerId={learnerId}
      onLearnerUnavailable={recoverMissingLearner}
    />
  );
}
