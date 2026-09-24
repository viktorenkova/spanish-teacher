# Post-lesson choice measurement

The closed pilot records two first-party choices against a completed lesson session. No third-party analytics service or browser cookie is used.

| Choice | Recorded when | Interpretation |
| --- | --- | --- |
| `next_lesson` | The next lesson plan is created after `Continue` on completion | Successful continuation to the next plan |
| `review` | The learner opens the Review tab within 30 minutes of completing a lesson | Interest in review after completion; opening the tab does not imply finishing phrase practice |

The API accepts an event only for a completed session belonging to the supplied learner and within 30 minutes of `completed_at`. Repeated selections of the same choice for the same lesson count once. A session can count in both columns if the learner does both actions. The Review choice can be recorded after a page reload if the completed session is still in the 30-minute window.

The operator report uses completed lessons in the selected time window as the denominator and distinct lesson sessions with each choice as the numerators. Run it after the new migration is deployed:

```bash
npm run pilot:learning-report -- --days 7
```

Use a reporting window that begins after this instrumentation was deployed. Older completed lessons have no choice events and would understate both percentages. Browser/network failures can also undercount choices; a tracking failure never blocks the learner's next action.

Stored fields are learner ID, lesson session ID, choice, and timestamp. The event does not contain names, answers, transcripts, or audio. Deleting a learner cascades to these events.
