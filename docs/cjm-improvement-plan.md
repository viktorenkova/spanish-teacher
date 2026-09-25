# CJM improvement plan · September 2026

## Scope and evidence

Route: first entry → diagnostic → Today → lesson plan → lesson → completion → next lesson → review. This is a follow-up to the [completed learning-journey UX plan](ux-learning-journey-plan.md).

The live desktop and `390×844` mobile audit covered onboarding, diagnostic, Today, plan, four choice exercises, the listening exercise, the speaking screen, lesson exit, and a four-phrase self-check. The production completion and next-lesson transition were **not** reached: microphone permission was not granted. Existing E2E coverage is evidence of functional behavior, not a substitute for observing this live path. A temporary `CJM test` learner remains on production pending explicit confirmation of its permanent deletion.

## Phase 1 — Put Today's action first (high priority)

- [ ] Place `Build today's lesson` immediately after the next-topic card, before adaptation reasons.
- [ ] Move `Why this is useful today` into optional details or below the primary action.
- [ ] Keep duration change secondary and keep Today/Review/Progress navigation clear.

Acceptance: at `390×844`, a new and a returning learner can see the topic and primary action in the first viewport; there is one dominant CTA and no horizontal overflow.

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

## Implementation order

1. Today's primary action and mobile regression.
2. Speaking fallback decision, implementation, and failure-path tests.
3. Feedback and phrase self-check simplification.
4. Diagnostic draft persistence.
5. End-to-end CJM and accessibility verification.
