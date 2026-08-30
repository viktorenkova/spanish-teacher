"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
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

export function CoachExperience() {
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
      onChangeLearner={() => {
        setRecoveryNotice(undefined);
        clearActiveLocalLearner();
      }}
      onLearnerAvailable={rememberAvailableLearner}
      onLearnerUnavailable={() => recoverMissingLearner(learnerId)}
    />
  );
}
