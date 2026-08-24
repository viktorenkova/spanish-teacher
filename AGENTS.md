# AGENTS.md — Spanish Coach

## Mission

Build a calm, adaptive Spanish coach that leads the learner through short,
measurable practice and remembers progress and recurring weaknesses.

## Learner profile

- Target language: Spanish, current level **A1**.
- Support language: English, current level **B1**.
- Default Spanish variant: Spain Spanish (`es-ES`).
- Goal: practical conversation and gradual progression from A1 toward A2.
- English explanations must use clear B1-level language and avoid unnecessary
  linguistic terminology.

Do not interpret B1 as the learner's Spanish level. The initial diagnostic
estimates early, mid, or strong A1 separately for speaking, vocabulary,
listening, and grammar.

## Learning priorities

1. Speaking and conversational ability.
2. Vocabulary in phrases and constructions.
3. Listening comprehension.
4. Grammar in service of communication.

Use Spanish first, with visible and easy-to-reach English scaffolding suitable
for an A1 learner. Speaking should normally be present in every lesson.

## Product principles

- The app decides what is most useful next.
- Prefer meaningful phrases to isolated words.
- A correct answer once does not mean an item is learned.
- Remember important and recurring mistakes across lessons.
- Increase difficulty gradually and keep the experience non-punitive.
- Use deterministic code for scheduling, persistence, timing, and scoring when
  possible; reserve AI for conversation, explanations, and language reasoning.
- Do not claim pronunciation scoring from transcription alone.

## MVP-0

Prove one coherent ten-minute A1 learning loop:

1. Present a small contextual objective.
2. Let the learner understand and retrieve useful language.
3. Include listening and speaking.
4. Give concise, understandable feedback.
5. Store the attempt and any meaningful mistake.
6. Update review state so the next lesson changes.
7. Show meaningful progress at completion.

Initial topics are introductions, daily routines, and ordering in a cafe.

## Technical direction

- Next.js, React, TypeScript, Tailwind CSS.
- Next.js server capabilities in a modular monolith.
- PostgreSQL with Drizzle ORM when persistence is introduced.
- FSRS through `ts-fsrs`; do not invent a scheduler.
- PWA/web first; native mobile is not part of MVP.
- AI, STT, and TTS must sit behind provider interfaces.
- Prefer vertical slices that remain runnable.

Keep learner state, learning items, exercise definitions, exercise attempts,
lesson sessions, curriculum decisions, and teacher feedback as separate domain
concepts. Do not collapse them into an opaque AI lesson object.

## Data and licensing

Every imported learning object must retain source URL, source record ID,
license, attribution, retrieval date, transformation version, and QA status.
Do not import data of unknown origin. Keep non-commercial and share-alike data
separate until an explicit product licensing decision is made.

Raw speech audio is temporary by default. Prefer retaining the transcript and
derived learning signals rather than indefinite recordings.

## MVP non-goals

No social network, leaderboards, billing, course marketplace, multiple target
languages, native apps, advanced pronunciation scoring, custom LLM, custom SRS,
or microservices unless explicitly approved.

## Engineering rules

- Inspect existing code and documentation before changing it.
- Preserve product decisions and choose the smallest coherent implementation.
- Ask before changing product goals, learning methodology, foundational data
  model, core UX, major dependencies, AI-provider strategy, cost model, or MVP
  scope.
- A feature is done only when the UI path works, important edge cases are
  handled, relevant tests pass, and it improves usable Spanish.
- Keep accessibility, responsive layout, and reduced-motion preferences in the
  quality bar.

