"use client";

import { useEffect, useState, type FormEvent } from "react";
import type {
  PilotFeedback,
  PilotFeedbackMicrophone,
  PilotFeedbackPacing,
  PilotFeedbackReadingTime,
} from "@/domain/pilot-feedback";

type PilotFeedbackFormProps = {
  learnerId: string;
  sessionId: string;
};

const pacingLabels: Record<PilotFeedbackPacing, string> = {
  too_fast: "Too fast",
  comfortable: "Comfortable",
  too_slow: "Too slow",
};

const readingTimeLabels: Record<PilotFeedbackReadingTime, string> = {
  too_short: "Not enough time",
  almost_enough: "Almost enough",
  enough: "Enough time",
};

const microphoneLabels: Record<PilotFeedbackMicrophone, string> = {
  complete: "Captured the full answer",
  partial: "Captured only part",
  missed: "Did not capture it",
  not_used: "I did not use it",
};

export function PilotFeedbackForm({ learnerId, sessionId }: PilotFeedbackFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [pacing, setPacing] = useState<PilotFeedbackPacing | "">("");
  const [readingTime, setReadingTime] = useState<PilotFeedbackReadingTime | "">("");
  const [microphoneCapture, setMicrophoneCapture] = useState<PilotFeedbackMicrophone | "">("");
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState<PilotFeedback>();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ learnerId, sessionId });
    fetch(`/api/pilot-feedback?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as { feedback?: PilotFeedback | null; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Lesson feedback could not be loaded.");
        return payload.feedback ?? undefined;
      })
      .then((feedback) => {
        if (feedback) {
          setSaved(feedback);
          setOverallRating(feedback.overallRating);
          setPacing(feedback.pacing);
          setReadingTime(feedback.readingTime);
          setMicrophoneCapture(feedback.microphoneCapture);
          setComment(feedback.comment ?? "");
        }
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Lesson feedback could not be loaded.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [learnerId, sessionId]);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!overallRating || !pacing || !readingTime || !microphoneCapture || submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/pilot-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId,
          sessionId,
          overallRating,
          pacing,
          readingTime,
          microphoneCapture,
          comment,
        }),
      });
      const payload = (await response.json()) as { feedback?: PilotFeedback; error?: string };
      if (!response.ok || !payload.feedback) {
        throw new Error(payload.error ?? "Lesson feedback could not be saved.");
      }
      setSaved(payload.feedback);
      setEditing(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Lesson feedback could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <section className="pilot-feedback-card" aria-live="polite">Loading lesson feedback…</section>;
  }

  if (saved && !editing) {
    return (
      <section className="pilot-feedback-card saved" aria-labelledby="pilot-feedback-title">
        <span className="eyebrow">Feedback saved</span>
        <h3 id="pilot-feedback-title">Thank you — this will guide the next pilot changes.</h3>
        <p>
          {saved.overallRating}/5 · {pacingLabels[saved.pacing]} · {readingTimeLabels[saved.readingTime]}
          {` · ${microphoneLabels[saved.microphoneCapture]}`}
        </p>
        <button className="text-button" type="button" onClick={() => setEditing(true)}>
          Update my feedback
        </button>
      </section>
    );
  }

  return (
    <section className="pilot-feedback-card" aria-labelledby="pilot-feedback-title">
      <span className="eyebrow">Closed pilot feedback</span>
      <h3 id="pilot-feedback-title">How did this lesson feel?</h3>
      <p>This is optional. Your answer is stored separately from your Spanish progress.</p>
      <form className="pilot-feedback-form" onSubmit={submitFeedback}>
        <fieldset>
          <legend>Overall lesson</legend>
          <div className="rating-options">
            {[1, 2, 3, 4, 5].map((rating) => (
              <label key={rating} className={overallRating === rating ? "chosen" : ""}>
                <input
                  type="radio"
                  name="overall-rating"
                  value={rating}
                  checked={overallRating === rating}
                  onChange={() => setOverallRating(rating)}
                />
                <span>{rating}</span>
              </label>
            ))}
          </div>
          <small>1 = difficult, 5 = great</small>
        </fieldset>

        <label>
          Lesson pace
          <select value={pacing} onChange={(event) => setPacing(event.target.value as PilotFeedbackPacing)} required>
            <option value="">Choose one</option>
            <option value="too_fast">Too fast</option>
            <option value="comfortable">Comfortable</option>
            <option value="too_slow">Too slow</option>
          </select>
        </label>

        <label>
          Time to read hints and comments
          <select
            value={readingTime}
            onChange={(event) => setReadingTime(event.target.value as PilotFeedbackReadingTime)}
            required
          >
            <option value="">Choose one</option>
            <option value="too_short">Not enough time</option>
            <option value="almost_enough">Almost enough</option>
            <option value="enough">Enough time</option>
          </select>
        </label>

        <label>
          Microphone transcription
          <select
            value={microphoneCapture}
            onChange={(event) => setMicrophoneCapture(event.target.value as PilotFeedbackMicrophone)}
            required
          >
            <option value="">Choose one</option>
            <option value="complete">Captured my full answer</option>
            <option value="partial">Captured only part</option>
            <option value="missed">Did not capture it</option>
            <option value="not_used">I did not use it</option>
          </select>
        </label>

        <label>
          What should we improve? <small>Optional</small>
          <textarea
            value={comment}
            maxLength={1_000}
            rows={4}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tell us what felt unclear, slow, or difficult."
          />
        </label>

        {error && <p className="feedback retry" role="alert">{error}</p>}
        <div className="pilot-feedback-actions">
          {saved && (
            <button className="text-button" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
          <button
            className="secondary-button"
            type="submit"
            disabled={!overallRating || !pacing || !readingTime || !microphoneCapture || submitting}
          >
            {submitting ? "Saving feedback…" : "Send feedback"}
          </button>
        </div>
      </form>
    </section>
  );
}
