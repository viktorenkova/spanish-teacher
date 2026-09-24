"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  activateLocalLearner,
  clearActiveLocalLearner,
  forgetLocalLearnerProfile,
  getActiveLearnerSnapshot,
  getLocalLearnerProfilesSnapshot,
  parseLocalLearnerProfiles,
  rememberLocalLearnerProfile,
  subscribeToLocalLearners,
  type LocalLearnerProfile,
} from "@/browser/local-learner-profiles";
import { LocalProfileChooser } from "./local-profile-chooser";
import { OnboardingExperience } from "./onboarding-experience";
import { PlannedLessonExperience } from "./planned-lesson-experience";

export type CoachMode = "welcome" | "diagnostic" | "dashboard" | "plan" | "lesson" | "review" | "completion";

export function CoachExperience({ onModeChange }: { onModeChange: (mode: CoachMode) => void }) {
  const learnerId = useSyncExternalStore(subscribeToLocalLearners, getActiveLearnerSnapshot, () => "");
  const profilesSnapshot = useSyncExternalStore(
    subscribeToLocalLearners,
    getLocalLearnerProfilesSnapshot,
    () => "[]",
  );
  const profiles = useMemo(
    () => parseLocalLearnerProfiles(profilesSnapshot),
    [profilesSnapshot],
  );
  const [recoveryNotice, setRecoveryNotice] = useState<string>();
  const [creatingProfile, setCreatingProfile] = useState(false);

  useEffect(() => {
    if (learnerId || profiles.length > 0) onModeChange("dashboard");
  }, [learnerId, onModeChange, profiles.length]);

  const recoverMissingLearner = useCallback((missingLearnerId: string) => {
    forgetLocalLearnerProfile(missingLearnerId);
    setRecoveryNotice(
      "That saved profile could not be found. Choose another learner or create a new local profile.",
    );
  }, []);

  const rememberAvailableLearner = useCallback((profile: LocalLearnerProfile) => {
    rememberLocalLearnerProfile(profile);
  }, []);

  if (!learnerId) {
    if (profiles.length > 0 && !creatingProfile) {
      return (
        <LocalProfileChooser
          notice={recoveryNotice}
          profiles={profiles}
          onCreateProfile={() => {
            setRecoveryNotice(undefined);
            setCreatingProfile(true);
          }}
          onSelectProfile={(selectedLearnerId) => {
            setRecoveryNotice(undefined);
            activateLocalLearner(selectedLearnerId);
          }}
        />
      );
    }

    return (
      <OnboardingExperience
        notice={recoveryNotice}
        onStepChange={(step) => onModeChange(step === "profile" ? "welcome" : "diagnostic")}
        onCancel={profiles.length > 0 ? () => setCreatingProfile(false) : undefined}
        onComplete={(profile) => {
          rememberLocalLearnerProfile(profile);
          setRecoveryNotice(undefined);
          setCreatingProfile(false);
        }}
      />
    );
  }

  return (
    <PlannedLessonExperience
      learnerId={learnerId}
      onModeChange={onModeChange}
      onChangeLearner={() => {
        setRecoveryNotice(undefined);
        clearActiveLocalLearner();
      }}
      onLearnerDeleted={() => forgetLocalLearnerProfile(learnerId)}
      onLearnerAvailable={rememberAvailableLearner}
      onLearnerUnavailable={() => recoverMissingLearner(learnerId)}
    />
  );
}
