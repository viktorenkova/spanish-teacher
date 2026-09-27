"use client";

import type { LearnerOverview } from "@/domain/learner-overview";
import { PhrasebookRecall } from "./phrasebook-recall";

export function ReviewExperience({
  learnerId,
  items,
  onBackToReview,
  onReturnToToday,
  onSaved,
}: {
  learnerId: string;
  items: LearnerOverview["phrasebook"];
  onBackToReview: () => void;
  onReturnToToday: () => void;
  onSaved: (learningItemId: string, remembered: boolean) => void;
}) {
  return (
    <section className="lesson-card review-experience">
      <span className="eyebrow">Quick phrase practice</span>
      <PhrasebookRecall
        learnerId={learnerId}
        items={items}
        closeLabel="Back to Review"
        onClose={onBackToReview}
        onReturnToToday={onReturnToToday}
        onSaved={onSaved}
      />
    </section>
  );
}
