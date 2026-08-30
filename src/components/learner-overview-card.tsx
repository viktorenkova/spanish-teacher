"use client";

import { FormEvent, useState } from "react";
import type { LearnerOverview } from "@/domain/learner-overview";
import {
  learnerPrimaryGoalLabels,
  learnerPrimaryGoals,
  type LearnerPrimaryGoal,
} from "@/domain/learner-profile";
import {
  supportedSessionDurations,
  type SessionDuration,
} from "@/domain/lesson-planner";

export function LearnerOverviewCard({
  overview,
  onChangeLearner,
  onDeleteLearner,
  onRenameLearner,
  onUpdatePreferences,
}: {
  overview: LearnerOverview;
  onChangeLearner: () => void;
  onDeleteLearner: (confirmationDisplayName: string) => Promise<void>;
  onRenameLearner: (displayName: string) => Promise<void>;
  onUpdatePreferences: (preferences: {
    primaryGoal: LearnerPrimaryGoal;
    preferredSessionMinutes: SessionDuration;
  }) => Promise<void>;
}) {
  const [managing, setManaging] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [displayName, setDisplayName] = useState(overview.learner.displayName);
  const [primaryGoal, setPrimaryGoal] = useState(overview.learner.primaryGoal);
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState(
    overview.learner.preferredSessionMinutes,
  );
  const [confirmationName, setConfirmationName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function renameLearner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await onRenameLearner(displayName.trim());
      setMessage("Learner name updated.");
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "The learner name could not be updated.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteLearner() {
    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await onDeleteLearner(confirmationName);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The learner profile could not be deleted.");
      setSubmitting(false);
    }
  }

  async function updatePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await onUpdatePreferences({ primaryGoal, preferredSessionMinutes });
      setMessage("Learning preferences updated.");
    } catch (preferenceError) {
      setError(preferenceError instanceof Error
        ? preferenceError.message
        : "Learning preferences could not be updated.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="learner-overview" aria-labelledby="next-lesson-title">
      <div>
        <span className="eyebrow">Saved progress · {overview.learner.displayName}</span>
        <h3 id="next-lesson-title">
          {overview.curriculumComplete ? "Keep building confidence" : `Up next: ${overview.nextLesson.title}`}
        </h3>
        <p>{overview.nextLesson.objective}</p>
      </div>
      <dl>
        <div><dt>Lessons complete</dt><dd>{overview.completedLessonCount}</dd></div>
        <div><dt>Topics complete</dt><dd>{overview.completedTopicCount}/{overview.totalTopicCount}</dd></div>
        <div><dt>Reviews ready</dt><dd>{overview.dueReviewCount}</dd></div>
      </dl>
      <small>
        {overview.learner.overallLevel} · {overview.learner.a1Band} A1 · {overview.introducedItemCount} phrase{overview.introducedItemCount === 1 ? "" : "s"} started
        {overview.hasCompletedSpeakingTask ? " · speaking practice saved" : " · speaking is included in every lesson"}
      </small>
      <div className="learner-profile-actions">
        <button className="text-button" type="button" onClick={onChangeLearner}>
          Change learner
        </button>
        <button
          className="text-button"
          type="button"
          aria-expanded={managing}
          aria-controls="learner-profile-management"
          onClick={() => {
            setManaging((value) => !value);
            setDisplayName(overview.learner.displayName);
            setPrimaryGoal(overview.learner.primaryGoal);
            setPreferredSessionMinutes(overview.learner.preferredSessionMinutes);
            setConfirmationName("");
            setConfirmingDelete(false);
            setError(undefined);
            setMessage(undefined);
          }}
        >
          {managing ? "Close profile settings" : "Manage profile"}
        </button>
      </div>

      {managing && (
        <div className="learner-profile-management" id="learner-profile-management">
          <form className="learner-name-form" onSubmit={renameLearner}>
            <label>
              Learner name
              <input
                required
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <button
              className="secondary-button"
              type="submit"
              disabled={submitting || !displayName.trim() || displayName.trim() === overview.learner.displayName}
            >
              {submitting ? "Saving…" : "Save name"}
            </button>
          </form>

          <form className="learner-preferences-form" onSubmit={updatePreferences}>
            <label>
              Main learning goal
              <select
                value={primaryGoal}
                onChange={(event) => setPrimaryGoal(event.target.value as LearnerPrimaryGoal)}
              >
                {learnerPrimaryGoals.map((goal) => (
                  <option key={goal} value={goal}>{learnerPrimaryGoalLabels[goal]}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Preferred lesson length</legend>
              <div className="profile-duration-options">
                {supportedSessionDurations.map((minutes) => (
                  <label key={minutes} className={preferredSessionMinutes === minutes ? "chosen" : ""}>
                    <input
                      type="radio"
                      name="profile-duration"
                      checked={preferredSessionMinutes === minutes}
                      onChange={() => setPreferredSessionMinutes(minutes)}
                    />
                    {minutes} min
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              className="secondary-button"
              type="submit"
              disabled={
                submitting
                || (
                  primaryGoal === overview.learner.primaryGoal
                  && preferredSessionMinutes === overview.learner.preferredSessionMinutes
                )
              }
            >
              {submitting ? "Saving…" : "Save learning preferences"}
            </button>
          </form>

          {!confirmingDelete ? (
            <button
              className="text-button danger-text-button"
              type="button"
              onClick={() => {
                setConfirmingDelete(true);
                setMessage(undefined);
              }}
            >
              Delete profile and progress
            </button>
          ) : (
            <div className="profile-delete-confirmation" role="group" aria-labelledby="profile-delete-title">
              <strong id="profile-delete-title">Permanently delete this learner?</strong>
              <p>
                Lessons, attempts, reviews, feedback, and mistake memory for this learner will be deleted.
                This cannot be undone.
              </p>
              <label>
                Type <strong>{overview.learner.displayName}</strong> to confirm
                <input
                  autoComplete="off"
                  value={confirmationName}
                  onChange={(event) => setConfirmationName(event.target.value)}
                />
              </label>
              <div>
                <button
                  className="text-button"
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setConfirmingDelete(false);
                    setConfirmationName("");
                    setError(undefined);
                  }}
                >
                  Keep profile
                </button>
                <button
                  className="danger-button"
                  type="button"
                  disabled={submitting || confirmationName !== overview.learner.displayName}
                  onClick={deleteLearner}
                >
                  {submitting ? "Deleting…" : "Permanently delete profile"}
                </button>
              </div>
            </div>
          )}
          {message && <p className="profile-management-message" role="status">{message}</p>}
          {error && <p className="feedback retry" role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
