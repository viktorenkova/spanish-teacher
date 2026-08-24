# Learner profile and diagnostic model

## Learner

The first persistent aggregate stores language configuration, preferred lesson
duration, primary goal, prior experience, and the current A1 band. Spanish is
fixed to A1 and `es-ES`; English B1 is support metadata, not a learning target.

## Skill estimates

Vocabulary, grammar, reading, listening, and speaking are stored independently.
An estimate has an assessment status, confidence, evidence count, and optional
A1 band. Text questions initially assess vocabulary, grammar, and reading only.
Listening and speaking are deliberately `unassessed` until audio evidence exists.

## Diagnostic attempt

Every completed diagnostic retains its version, submitted answers, score, and
completion time. The result is reproducible because scoring is deterministic
and the version is stored with the evidence.

## Current limitations

- The browser stores only the learner ID needed to resume the experience.
- Authentication is deferred while the product remains single-user.
- Lesson attempts still use browser persistence and will move to PostgreSQL in
  the learning-items/FSRS slice.
- The text diagnostic is a starting hypothesis, not a full CEFR assessment.

