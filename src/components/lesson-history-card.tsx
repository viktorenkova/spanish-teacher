import type { LessonHistoryEntry } from "@/domain/lesson-history";

const historyDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function HistoryEntry({ entry }: { entry: LessonHistoryEntry }) {
  return (
    <li className="lesson-history-entry">
      <div className="lesson-history-heading">
        <div>
          <time dateTime={entry.completedAt}>
            {historyDateFormatter.format(new Date(entry.completedAt))}
          </time>
          <strong>{entry.lessonTitle}</strong>
        </div>
        <span>{entry.accuracyPercent}%</span>
      </div>
      <dl>
        <div><dt>Answers</dt><dd>{entry.attemptCount}</dd></div>
        <div><dt>Correct</dt><dd>{entry.correctCount}</dd></div>
        <div><dt>Time</dt><dd>{entry.durationMinutes} min</dd></div>
        <div><dt>Speaking</dt><dd>{entry.speakingCompleted ? "Done" : "Not yet"}</dd></div>
      </dl>
      <p>{entry.changeSummary}</p>
    </li>
  );
}

export function LessonHistoryCard({ history }: { history: LessonHistoryEntry[] }) {
  const recent = history.slice(0, 3);
  const earlier = history.slice(3);

  return (
    <section className="lesson-history" aria-labelledby="lesson-history-title">
      <span className="eyebrow">Learning over time</span>
      <h3 id="lesson-history-title">Recent lessons</h3>
      <ol>{recent.map((entry) => <HistoryEntry key={entry.sessionId} entry={entry} />)}</ol>
      {earlier.length > 0 && (
        <details>
          <summary>Show {earlier.length} earlier lesson{earlier.length === 1 ? "" : "s"}</summary>
          <ol start={4}>{earlier.map((entry) => <HistoryEntry key={entry.sessionId} entry={entry} />)}</ol>
        </details>
      )}
    </section>
  );
}
