# UX plan: the learning journey

## Goal

Make the route `first entry → diagnostic → lesson plan → lesson → completion → next lesson → review` feel like one calm, directed learning flow on desktop and mobile.

The main success condition is that the learner always understands the current task and the next useful action without scrolling through unrelated content.

## Product decisions

- Show the marketing hero only on the first profile step.
- Use a compact application header for diagnostic, planning, lessons, completion, and review.
- Use a dedicated full-screen completion state instead of a conventional modal. This keeps browser history, accessibility, and small-screen behaviour predictable.
- Make the next lesson the primary action after completion.
- Keep review and progress available as separate secondary flows.
- Keep closed-pilot feedback optional and separate from the main completion action.

## Phase 1 — Separate the interface modes

- [x] Add explicit UI modes: `welcome`, `diagnostic`, `dashboard`, `plan`, `lesson`, and `completion`.
- [x] Remove the hero after the learner leaves the first profile step.
- [x] Use a compact header and reset scroll position on every major state change.
- [x] Keep lesson content focused and free of dashboard content.

### Acceptance criteria

- The hero is visible only on first entry.
- Diagnostic and every returning-learner screen begin near the top of the viewport.
- Changing states never leaves the learner at an old scroll position.

## Phase 2 — Simplify onboarding and diagnostic

- [ ] Keep the first screen focused on profile setup and one primary CTA.
- [ ] Keep the diagnostic reassuring and show its length before the questions.
- [ ] Preserve semantic fieldsets, keyboard access, and clear error feedback.

### Acceptance criteria

- The first CTA is visible without unnecessary scrolling on common mobile screens.
- The learner understands that the diagnostic is short and non-punitive.

## Phase 3 — Make the lesson plan actionable

- [x] Put the lesson objective, duration, and primary `Start` action before detailed blocks.
- [x] Move adaptation reasons and the full block list into optional details.
- [x] Keep duration change available as a secondary action.
- [ ] Consider a sticky mobile action only if the short plan still exceeds one viewport.

### Acceptance criteria

- The `Start` action is visible in the first viewport on desktop and mobile.
- The plan explains the lesson without requiring the learner to read implementation detail.

## Phase 4 — Focus the active lesson

- [x] Show only compact branding, progress, the current exercise, feedback, and lesson controls.
- [x] Keep `End lesson` secondary and require confirmation.
- [x] Preserve speaking, listening, saved progress, and reduced-motion behaviour.

### Acceptance criteria

- No marketing or dashboard blocks appear during a lesson.
- The current task and its main action are visually dominant.

## Phase 5 — Add a dedicated completion state

- [x] Show `Lesson complete`, one concrete outcome, and three short metrics.
- [x] Make `Continue to next lesson` the primary action.
- [x] Offer `Finish for today` as a secondary action.
- [x] Move useful phrases, recall, teacher feedback, mistake memory, and pilot feedback into optional detail sections.
- [x] Load and name the next lesson before the primary action when possible.

### Acceptance criteria

- The primary next step is visible immediately on desktop and mobile.
- Completion does not require scrolling through feedback or a rating form.
- Pilot feedback never blocks finishing or continuing.

## Phase 6 — Separate dashboard intentions

- [ ] Organise returning-learner content into `Today`, `Review`, and `Progress` sections.
- [ ] Remove duplicate next-topic and progress summaries.
- [ ] Show review as recommended only when reviews are due.
- [ ] Keep profile management visually separate from learning actions.

### Acceptance criteria

- There is one dominant CTA on the dashboard.
- The same next topic or progress value is not repeated in competing cards.
- Review count and estimated effort are clear before review starts.

## Phase 7 — Create a bounded review flow

- [ ] Start review as a distinct state with a phrase count and estimated duration.
- [ ] Present one phrase/action at a time instead of many competing listen/speak controls.
- [ ] End review with a short result and a clear return to `Today`.

### Acceptance criteria

- Review has one active task at a time.
- The learner can exit safely without losing lesson progress.

## Phase 8 — Verification and measurement

- [ ] Add end-to-end coverage for the full journey and both post-lesson choices.
- [ ] Test at desktop `1440×900` and mobile `390×844`.
- [ ] Check keyboard order, focus visibility, headings, labels, live regions, and touch targets of at least `44×44` CSS pixels.
- [ ] Check reduced motion, horizontal overflow, console errors, and preserved progress.
- [ ] Measure completion-to-next-lesson continuation and completion-to-review selection when product analytics is introduced.

## Implementation order

1. Interface modes, hero removal, and scroll reset.
2. Short lesson plan with an above-the-fold CTA.
3. Dedicated completion state and direct next-lesson transition.
4. Dashboard separation.
5. Bounded review flow.
6. Full desktop/mobile regression and accessibility pass.

## Definition of done

- A new learner can complete the full route without encountering competing primary actions.
- A returning learner can immediately identify today’s lesson, due review, and saved progress.
- After finishing a lesson, the next lesson is obvious without scrolling.
- The mobile route has no horizontal overflow and no essential action below unrelated content.
- Relevant unit, integration, and browser tests pass.
