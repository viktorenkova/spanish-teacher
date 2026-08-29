# Adaptive curriculum

## Implemented sequence

The first deterministic curriculum path is:

1. Introductions and personal information.
2. Daily routines.
3. Ordering food and drinks in a cafe.

The next topic unlocks only when every core exercise in the current topic has
successful evidence. Each topic retains recognition, active retrieval,
listening, and transcript-backed speaking.

## Review selection

When a lesson plan has review capacity, the planner creates executable recall
exercises from persisted learner state. It selects candidates in this order:

1. learning items connected to active or improving mistake memory;
2. remaining items whose FSRS due time has passed.

A candidate appears at most once in a plan. Correct review answers update the
underlying FSRS card. If the item is connected to mistake memory, the answer
also adds successful evidence; two later successful examples are still needed
to resolve a pattern.

Five-minute plans keep the mandatory core lesson and may have no review slot.
Longer plans add review work only when their duration budget has room.

## Boundaries

- Curriculum choice and scheduling are deterministic.
- Review exercises use only reviewed, project-authored learning items already
  present in the lesson catalogue.
- Speech transcription provides task-completion evidence, not pronunciation
  scoring.
- Plan JSON stores the exact review exercises shown to the learner so attempt
  validation does not trust exercise content sent by the browser.

## Learner return overview

Before a new plan is created, the learner sees progress reconstructed from
saved attempts, lesson sessions, and FSRS state. The overview shows completed
lessons and topics, reviews currently due, and the next deterministic topic.
It is read-only and does not create a plan or advance curriculum state.
