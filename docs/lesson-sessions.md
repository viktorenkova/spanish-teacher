# Lesson sessions

## Lifecycle

A lesson plan is inert until the learner starts it. Starting creates one
`active` lesson session for that learner and plan. Every new exercise attempt
stores the session identifier as well as the learner, lesson, exercise, and
learning-item identifiers.

After each saved attempt, deterministic code compares successful evidence in
the session with the exact core and review exercise IDs stored in its plan. The
session and plan become `completed` only when every planned exercise has a
correct attempt. Incorrect attempts update activity time but do not advance
completion.

The learner can explicitly end an unfinished session after a two-step
confirmation. The session and plan then become `abandoned`. Attempts, mistake
signals, and FSRS state already saved in that session remain available to later
planning, but the abandoned plan is neither resumed nor offered again. A
conditional status update prevents a late in-flight attempt from reopening an
abandoned session.

## Resume behavior

On application load, the client asks for an active session before loading a
loose plan. If one exists, the server returns the original saved plan and the
client loads progress scoped to that session. The first exercise without
successful evidence is shown, so a page reload does not restart or skip work.

Only one active session is allowed by the service. Attempts must provide a
matching learner, plan, session, and lesson key; content sent by the browser is
never trusted as the exercise definition.

## Compatibility

The attempt-to-session foreign key is nullable so attempts created before this
slice remain valid. New UI and API flows always create and use a session.

## Automated coverage

`npm run test:e2e` runs three Chromium paths:

1. Resume an active lesson at 20%, cancel an end action, then abandon it and
   verify that it stays closed after reload.
2. Complete onboarding and the full introduction lesson, including listening
   and browser-transcribed speaking, then verify that the next plan advances to
   daily routines.
3. Exercise onboarding at a mobile viewport with reduced motion while checking
   semantic form controls, unique IDs, and horizontal overflow.

Tests that create data remove their temporary learner and cascade-owned records
in a `finally` block. Browser media is mocked at the provider boundary; lesson,
attempt, persistence, and curriculum APIs remain real.
