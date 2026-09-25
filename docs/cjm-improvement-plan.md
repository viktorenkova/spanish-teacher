# CJM improvement plan · September 2026

## Scope and evidence

Route: first entry → diagnostic → Today → lesson plan → lesson → completion → next lesson → review. This is a follow-up to the [completed learning-journey UX plan](ux-learning-journey-plan.md).

The live desktop and `390×844` mobile audit covered onboarding, diagnostic, Today, plan, four choice exercises, the listening exercise, the speaking screen, lesson exit, and a four-phrase self-check. The production completion and next-lesson transition were **not** reached: microphone permission was not granted. Existing E2E coverage is evidence of functional behavior, not a substitute for observing this live path. A temporary `CJM test` learner remains on production pending explicit confirmation of its permanent deletion.

## Additional findings from manual lesson testing

The following are **learner-reported observations, not yet independently reproduced or diagnosed**. Preserve the examples and expected behavior when investigating. Priorities below follow the manual test report; they do not imply that a root cause has been established.

### P0 — Speech recognition repeats words and marks a correct answer wrong

- [ ] Reproduce the reported case: saying `Me levanto.` once can yield a transcript resembling `Me me me me levanto levanto levanto...` and an incorrect result.
- [ ] Locate the first point where duplication appears: microphone/capture → browser STT events → raw transcript → normalization → answer comparison → saved assessment. Do not hide an upstream STT defect by only relaxing comparison rules.
- [ ] Check short and long phrases, normal and slow speech, similar/repeated Spanish sounds, pauses, and mobile browsers.
- [ ] Prevent false negative scoring from recognition artifacts while preserving the distinction between task completion and pronunciation assessment.

Acceptance: a correctly spoken phrase is not rejected because interim or final STT segments were duplicated; the displayed transcript and saved assessment agree. If temporary diagnostics are needed, capture only the minimum raw/normalized transcript, expected answer, comparison, and result in a protected test context, remove or disable them afterward, and never expose them in learner UI or retain raw audio by default.

### P1 — A nominal 30-minute lesson finishes in about 5–7 minutes

- [ ] Measure actual time across several lessons and durations, then compare it with the planner's block estimates, exercise count, required stages, and material volume.
- [ ] Make the displayed duration and the useful learning workload agree; do not add filler simply to meet a timer.

Acceptance: a 30-minute choice no longer produces a 5–7-minute lesson without a clear explanation or corrected duration estimate.

### P1 — New language is tested before it is taught

- [ ] Audit each lesson for words or constructions first required in an exercise but not introduced beforehand. The reported café example includes `con` / `sin`, `con leche`, and `sin azúcar`.
- [ ] Introduce essential language with meaning, a contextual example, optional pronunciation/listening, and a short comprehension check before requiring retrieval or production.
- [ ] Preserve the progression: contextual objective → introduction → controlled practice → independent use → consolidation.

Acceptance: an A1 learner can attempt the café tasks without already knowing language first presented in that same lesson; speaking and listening remain in the lesson. Exact teaching content and sequencing require a learning-methodology decision before implementation.

### P1 — Correct and incorrect sounds are too quiet and too similar

- [ ] Make success and retry cues acoustically distinct and audible relative to the rest of the interface; keep the retry cue calm and non-punitive.
- [ ] Test on mobile and desktop browsers, with the saved sound setting on/off and while Spanish playback or microphone recording is active.

Acceptance: users can reliably distinguish success from retry by sound at a normal device volume; visible feedback remains sufficient when muted or sound is unavailable.

### P2 — Technical text leaks into lesson-completion cards

- [ ] Identify the reported internal weight/score commentary and other developer-facing parameters across completion and summary screens.
- [ ] Replace them with learner-facing results, progress, mistakes, and useful language, or remove them where they add no learning value.

Acceptance: no internal weights, service labels, raw scoring fields, or other technical diagnostics appear on learner-facing completion screens. First reproduce and identify the exact strings before changing them.

## Phase 1 — Put Today's action first (high priority)

- [x] Place `Build today's lesson` immediately after the next-topic card, before adaptation reasons.
- [x] Move `Why this is useful today` into optional details or below the primary action.
- [x] Keep duration change secondary and keep Today/Review/Progress navigation clear.

Acceptance: at `390×844`, a new and a returning learner can see the topic and primary action in the first viewport; there is one dominant CTA and no horizontal overflow.

Verification: mobile and desktop full-loop E2E, including first-viewport action and optional-detail checks; lint and production build passed locally.

## Phase 2 — Make speaking recoverable (high priority)

- [ ] Define an accessible fallback when microphone permission is denied, speech recognition is unsupported, or transcription fails.
- [ ] Keep the speaking task in every lesson; do not equate typed text with spoken evidence or claim pronunciation scoring.
- [ ] Preserve progress and explain what the fallback does and does not assess.

Acceptance: a learner can finish the lesson without browser speech recognition, while saved evidence and feedback accurately distinguish speech from a fallback. This phase needs a product decision on the exact fallback and its effect on scoring before implementation.

## Phase 3 — Shorten exercise feedback (medium priority)

- [ ] Remove repeated wording between the status message and coaching card.
- [ ] Lead with one actionable hint on a wrong answer and one concise transfer prompt on a correct answer.
- [ ] Bring feedback into view and maintain sensible keyboard and screen-reader focus without surprising auto-advance.

Acceptance: after checking an answer on mobile, the learner can immediately see what happened, what to do next, and the relevant action; text remains accessible without sound.

## Phase 4 — Calm the phrase self-check (medium priority)

- [ ] Keep the phrase and `I remembered it` / `I needed help` near the top after reveal.
- [ ] Make extra listening and speaking practice optional, without hiding their availability.
- [ ] Retain the one-phrase-at-a-time flow and clear `Return to Today` result.

Acceptance: at `390×844`, the learner can reveal a phrase and find both self-check choices without scrolling through secondary instructions or media controls.

## Phase 5 — Preserve an interrupted diagnostic (lower priority)

- [ ] Save only the temporary profile name, preferences, and diagnostic selections locally until account creation.
- [ ] Restore them after reload, and clear the draft after successful creation or an explicit reset.
- [ ] Do not mistake a local draft for a created learner or transmit it before submission.

Acceptance: refreshing during diagnostic restores the draft and selected answers without creating duplicate profiles.

## Verification

- [ ] Re-run the full new-learner and returning-learner routes at desktop `1440×900` and mobile `390×844`.
- [ ] Cover no-microphone, denied-permission, and failed-transcription paths once Phase 2 is defined.
- [ ] Check first-viewport actions, keyboard/focus order, live regions, `44×44` touch targets, reduced motion, overflow, and persisted progress.
- [ ] Revisit the live completion → next lesson route with an authorised microphone or a defined fallback; record what was actually observed.
- [ ] Re-test several lessons for actual duration, introduction of new language, sound contrast and volume, speech transcript/assessment, and learner-facing completion copy.

## Implementation order

1. Today's primary action and mobile regression (done locally).
2. Reproduce and diagnose the reported STT duplication (P0); protect correct answers from recognition artifacts.
3. Audit lesson duration and prerequisite vocabulary; agree on the learning-design changes before implementation.
4. Distinguish and calibrate success/retry sounds; remove confirmed technical copy from completion.
5. Decide and implement a speaking fallback without misrepresenting spoken evidence.
6. Simplify exercise feedback and phrase self-check; preserve the interrupted diagnostic.
7. Re-test multiple lessons and the full desktop/mobile CJM, including completion and next lesson.
