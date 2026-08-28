# MVP-0: A1 vertical learning loop

## Purpose

Prove that Spanish Coach can teach and remember, rather than merely display a
set of disconnected exercises.

## Learner

- Spanish: A1.
- English support: B1.
- Variant: `es-ES`.

## First content scope

The pilot begins with three practical topics:

1. Introductions and personal information.
2. Daily routines.
3. Ordering food and drinks in a cafe.

The implementation includes introductions, daily routines, and ordering in a
cafe. Completing every objective advances the next generated plan through that
sequence. Longer plans can insert real retrieval exercises from due FSRS items
and active mistake memory before the new topic. Content remains deliberately
small and reviewed before any bulk data import.

## Ten-minute target flow

1. Explain the communicative goal in simple English.
2. Expose the learner to a short Spanish exchange.
3. Check meaning without revealing every translation immediately.
4. Ask the learner to retrieve a useful phrase.
5. Play a level-appropriate listening item.
6. Ask for a spoken response.
7. Distinguish transcription, task completion, grammar, and pronunciation.
8. Give concise feedback and an optional deeper explanation.
9. Store the attempt, meaningful error, and learning signal.
10. Update review state and summarize progress.

## Acceptance criteria

- The application loads as a responsive web experience.
- The learner can complete the initial introduction lesson without configuring
  a curriculum.
- Progress survives a page reload.
- English instructions are understandable at B1 and Spanish content is A1.
- At least one active retrieval action is required.
- The UI never claims to assess pronunciation without phoneme-level evidence.
- The next implementation slice can replace browser persistence without
  rewriting lesson UI or domain types.

## Still deferred

- Authentication and multi-user account security.
- A selected external language-model provider and open-ended AI conversation.
- Server speech-to-text and broader browser compatibility.
- Bulk lexical imports and a multi-topic curriculum.
