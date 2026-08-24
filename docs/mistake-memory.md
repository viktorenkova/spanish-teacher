# Structured mistake memory

Mistake memory turns individual feedback into a durable learning signal without
storing an opaque summary of everything the learner has ever done.

## Data model

`learner_mistakes` stores one aggregate per learner, learning item, and stable
mistake code. It includes:

- category and target pattern;
- a short B1-level explanation;
- occurrence and successful-evidence counts;
- `active`, `improving`, or `resolved` status;
- first-seen, last-seen, resolved, and updated timestamps.

`mistake_events` is the audit trail. Every `observed` or `successful_evidence`
event points to the exercise attempt that produced it. The unique event key
prevents the same attempt from contributing the same evidence twice.

## State transitions

```text
observed mistake -> active, success evidence reset to 0
first later success -> improving
second later success -> resolved
mistake observed again -> active, occurrence +1, success evidence reset to 0
```

A correct answer with no prior mistake does not create a mistake record. A
resolved record remains in PostgreSQL for history but is omitted from the
learner-facing outstanding list.

## Current codes

- `name_pronoun_mi`
- `name_construction_missing`
- `origin_preposition_de`
- `origin_construction_missing`

Codes are provider output contract values, not UI copy. Future providers must
map their corrections into an approved taxonomy before they can update memory.

## Adaptive curriculum handoff

The API exposes outstanding patterns with counts and status. The next roadmap
slice can use these signals when choosing review or targeted practice blocks;
the memory service itself does not silently alter lesson plans.
