import type { LearnerOverview } from "@/domain/learner-overview";

export function LearnerOverviewCard({
  overview,
  onChangeLearner,
}: {
  overview: LearnerOverview;
  onChangeLearner: () => void;
}) {
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
      <button className="text-button learner-change-button" type="button" onClick={onChangeLearner}>
        Change learner
      </button>
    </section>
  );
}
