# MVP architecture

## Shape

Spanish Coach is a modular monolith. UI, application orchestration, and server
routes live in one Next.js application. PostgreSQL is the system of record;
the browser retains only the learner identifier needed to resume the experience.

```text
UI components
    -> lesson application service
        -> lesson/content repository
        -> learner progress repository
        -> review scheduler
        -> feedback evaluator
        -> speech / AI / TTS provider ports
```

## Domain boundaries

- Learner profile: languages, level estimates, preferences.
- Learning item: word, phrase, construction, or grammar pattern.
- Exercise definition: a reusable way to test an objective.
- Exercise attempt: one learner interaction and its evidence.
- Lesson plan: selected objectives and ordered exercises.
- Lesson session: actual progress through a generated plan.
- Review state: FSRS data for an underlying learning item.
- Mistake: a structured, recurring learning signal.

Exercise attempts must not become the learning item itself. Multiple modalities
can provide evidence about one underlying item.

## Provider boundaries

The following capabilities require explicit interfaces before their first live
implementation:

- speech-to-text;
- text-to-speech;
- language-model tutoring;
- deterministic grammar/error checking;
- review scheduling.

This allows local and cloud implementations to change without rewriting lesson
logic.

## Persistence progression

1. PostgreSQL + Drizzle for profiles, attempts, plans, reviews, and feedback.
2. Browser storage for the resumable learner identifier only.
3. Offline cache and synchronization only after server persistence is stable.

## Content provenance

Imported content carries a source manifest and must remain traceable through
transformations. Content with `NC`, share-alike, or unclear terms stays in a
separate layer until its production use is approved.
