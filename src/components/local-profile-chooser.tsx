import type { LocalLearnerProfile } from "@/browser/local-learner-profiles";

type LocalProfileChooserProps = {
  notice?: string;
  profiles: LocalLearnerProfile[];
  onCreateProfile: () => void;
  onSelectProfile: (learnerId: string) => void;
};

export function LocalProfileChooser({
  notice,
  profiles,
  onCreateProfile,
  onSelectProfile,
}: LocalProfileChooserProps) {
  return (
    <section className="lesson-card local-profile-chooser" aria-labelledby="profile-chooser-title">
      <span className="eyebrow">Saved on this device</span>
      <h2 id="profile-chooser-title">Who is learning today?</h2>
      <p className="support-copy">
        Choose a profile to continue with its own lessons, reviews, and mistake memory.
      </p>
      {notice && <p className="profile-recovery-notice" role="status">{notice}</p>}
      <div className="local-profile-list">
        {profiles.map((profile) => (
          <button
            key={profile.learnerId}
            className="local-profile-button"
            type="button"
            onClick={() => onSelectProfile(profile.learnerId)}
          >
            <span aria-hidden="true">{profile.displayName.slice(0, 1).toLocaleUpperCase()}</span>
            <strong>{profile.displayName}</strong>
            <small>Continue with saved progress</small>
          </button>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={onCreateProfile}>
        Create a new learner profile
      </button>
      <p className="local-profile-note">
        This chooser only remembers profiles created or opened in this browser.
      </p>
    </section>
  );
}
