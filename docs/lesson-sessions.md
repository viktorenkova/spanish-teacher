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

`npm run test:e2e` runs a Chromium Playwright test that completes onboarding,
creates and starts a plan, answers one exercise, reloads the page, and verifies
that the same active session resumes at 20% completion. The test removes its
temporary learner and cascade-owned records in a `finally` block.
