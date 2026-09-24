"use client";

import type { LearnerOverview } from "@/domain/learner-overview";
import { PhrasebookRecall } from "./phrasebook-recall";

export function ReviewExperience({
  items,
  onBackToReview,
  onReturnToToday,
}: {
  items: LearnerOverview["phrasebook"];
  onBackToReview: () => void;
  onReturnToToday: () => void;
}) {
  return (
    <section className="lesson-card review-experience">
      <span className="eyebrow">Quick phrase practice</span>
      <PhrasebookRecall
        items={items}
        closeLabel="Back to Review"
        onClose={onBackToReview}
        onReturnToToday={onReturnToToday}
      />
    </section>
  );
}
