"use client";

import { FormEvent, useState } from "react";
import type { LearnerOverview } from "@/domain/learner-overview";

export function LearnerOverviewCard({
  overview,
  onChangeLearner,
  onDeleteLearner,
  onRenameLearner,
}: {
  overview: LearnerOverview;
  onChangeLearner: () => void;
  onDeleteLearner: (confirmationDisplayName: string) => Promise<void>;
  onRenameLearner: (displayName: string) => Promise<void>;
}) {
  const [managing, setManaging] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [displayName, setDisplayName] = useState(overview.learner.displayName);
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
          <form onSubmit={renameLearner}>
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
