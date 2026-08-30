import type { PracticeRhythm } from "@/domain/practice-rhythm";

export function PracticeRhythmCard({ rhythm }: { rhythm: PracticeRhythm }) {
  return (
    <section className="practice-rhythm" aria-labelledby="practice-rhythm-title">
      <div>
        <span className="eyebrow">A calm, regular habit</span>
        <h3 id="practice-rhythm-title">Your practice rhythm</h3>
        <p>{rhythm.guidance}</p>
      </div>
      <dl>
        <div><dt>Active days · 7</dt><dd>{rhythm.activeDaysLast7}</dd></div>
        <div><dt>Active days · 30</dt><dd>{rhythm.activeDaysLast30}</dd></div>
        <div><dt>Current rhythm</dt><dd>{rhythm.currentRunDays} day{rhythm.currentRunDays === 1 ? "" : "s"}</dd></div>
      </dl>
      <small>One or more completed lessons count as one active local day. Breaks are always okay.</small>
    </section>
  );
}
