# Learner profile and diagnostic model

## Learner

The first persistent aggregate stores language configuration, preferred lesson
duration, primary goal, prior experience, and the current A1 band. Spanish is
fixed to A1 and `es-ES`; English B1 is support metadata, not a learning target.

## Skill estimates

Vocabulary, grammar, reading, listening, and speaking are stored independently.
An estimate has an assessment status, confidence, evidence count, and optional
A1 band. Text questions initially assess vocabulary, grammar, and reading only.
The text diagnostic initially leaves listening and speaking `unassessed`. Lesson
attempts can now add separate listening and transcript-backed production evidence;
updating the diagnostic skill estimate from that evidence remains a later step.

## Diagnostic attempt

Every completed diagnostic retains its version, submitted answers, score, and
completion time. The result is reproducible because scoring is deterministic
and the version is stored with the evidence.

## Current limitations

- The browser stores only the learner ID needed to resume the experience.
- Authentication is deferred while the product remains single-user.
- The browser keeps only the learner ID; learning progress, attempts, modality
  evidence, and FSRS state are stored in PostgreSQL.
- The text diagnostic is a starting hypothesis, not a full CEFR assessment.

## Learning items and reviews

Learning items are project-authored words, phrases, constructions, or grammar
patterns with explicit source, license, attribution, and QA metadata. Exercise
attempts reference the underlying item and record modality, submitted answer,
correctness, FSRS rating, and the due date produced by the scheduler. Speaking
attempts additionally retain the transcript, evidence provider, optional provider
confidence, and deterministic assessment version. Raw audio is not retained.

Each learner/item pair has one FSRS card. Recognition, recall, listening, and
production evidence are accumulated separately without creating four unrelated
cards for the same language unit.

## Teacher feedback

Teacher feedback is stored separately from exercise attempts. Each record points
to one attempt and retains the provider ID, provider version, generation mode,
structured feedback content, and creation time. The current shape contains a
summary, praise, focused corrections, and one next step. This lets a future LLM
provider replace the local provider without turning attempts into opaque AI data.

## Mistake memory

Teacher corrections carry stable codes that update a learner/item mistake
aggregate. The aggregate retains category, target pattern, explanation,
occurrence count, successful evidence count, timestamps, and an `active`,
`improving`, or `resolved` state. A separate immutable event log connects every
observation or successful evidence point to its exercise attempt.

An observed recurrence resets successful evidence and reopens the pattern. One
later correct example changes it to `improving`; two are required for
`resolved`. This deliberately avoids treating one correct answer as mastery.

## Lesson plans

Each generated lesson plan records its requested and estimated duration,
planner version, learner goal, goal focus, selection rationale, and ordered blocks.
Planning uses the learner's goal, due FSRS state, and lower-confidence assessed skills.
The goal adds a visible practice lens without bypassing the prerequisite topic order.
The plan also stores learner-facing adaptation reasons separately from technical
rationale. These reasons describe only decisions that the generated plan actually
applies, using clear B1 English without scheduler terminology.
The first core listening and speaking
blocks are ready. Longer expansion blocks remain `provider_pending` until their
content and evidence paths are implemented.
