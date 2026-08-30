export type LocalLearnerProfile = {
  learnerId: string;
  displayName: string;
};

export const activeLearnerKey = "spanish-coach:learner-id:v1";
const learnerProfilesKey = "spanish-coach:learner-profiles:v1";
export const learnerProfilesEvent = "spanish-coach:learner-changed";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseLocalLearnerProfiles(serialized: string): LocalLearnerProfile[] {
  try {
    const value: unknown = JSON.parse(serialized);
    if (!Array.isArray(value)) return [];

    const learnerIds = new Set<string>();
    return value.flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object") return [];
      const learnerId = "learnerId" in candidate ? candidate.learnerId : undefined;
      const displayName = "displayName" in candidate ? candidate.displayName : undefined;
      if (
        typeof learnerId !== "string"
        || !uuidPattern.test(learnerId)
        || typeof displayName !== "string"
        || !displayName.trim()
        || learnerIds.has(learnerId)
      ) return [];

      learnerIds.add(learnerId);
      return [{ learnerId, displayName: displayName.trim() }];
    });
  } catch {
    return [];
  }
}

export function mergeLocalLearnerProfile(
  profiles: LocalLearnerProfile[],
  profile: LocalLearnerProfile,
) {
  return [profile, ...profiles.filter(({ learnerId }) => learnerId !== profile.learnerId)];
}

export function subscribeToLocalLearners(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(learnerProfilesEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(learnerProfilesEvent, onStoreChange);
  };
}

export function getActiveLearnerSnapshot() {
  return window.localStorage.getItem(activeLearnerKey) ?? "";
}

export function getLocalLearnerProfilesSnapshot() {
  return window.localStorage.getItem(learnerProfilesKey) ?? "[]";
}

function notifyLocalLearnerChange() {
  window.dispatchEvent(new Event(learnerProfilesEvent));
}

export function rememberLocalLearnerProfile(profile: LocalLearnerProfile) {
  const current = parseLocalLearnerProfiles(getLocalLearnerProfilesSnapshot());
  const next = mergeLocalLearnerProfile(current, profile);
  const serialized = JSON.stringify(next);
  const changed = serialized !== JSON.stringify(current)
    || getActiveLearnerSnapshot() !== profile.learnerId;

  window.localStorage.setItem(learnerProfilesKey, serialized);
  window.localStorage.setItem(activeLearnerKey, profile.learnerId);
  if (changed) notifyLocalLearnerChange();
}

export function activateLocalLearner(learnerId: string) {
  window.localStorage.setItem(activeLearnerKey, learnerId);
  notifyLocalLearnerChange();
}

export function clearActiveLocalLearner() {
  window.localStorage.removeItem(activeLearnerKey);
  notifyLocalLearnerChange();
}

export function forgetLocalLearnerProfile(learnerId: string) {
  const profiles = parseLocalLearnerProfiles(getLocalLearnerProfilesSnapshot());
  window.localStorage.setItem(
    learnerProfilesKey,
    JSON.stringify(profiles.filter((profile) => profile.learnerId !== learnerId)),
  );
  if (getActiveLearnerSnapshot() === learnerId) {
    window.localStorage.removeItem(activeLearnerKey);
  }
  notifyLocalLearnerChange();
}
