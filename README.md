# Spanish Coach

Spanish Coach is a web-first adaptive teacher for a learner whose Spanish is
currently **A1** and whose support language, English, is **B1**. The default
target is Spain Spanish (`es-ES`).

The product leads the learner through short sessions combining speaking,
vocabulary, listening, and practical grammar. It remembers what the learner
knows, schedules useful retrieval, and brings meaningful mistakes back in later
lessons.

## Current milestone

The repository is implementing MVP-0: one coherent A1 lesson loop before the
larger adaptive curriculum is built. The current slice adds persistent learner
profiles and a deterministic A1 onboarding diagnostic before the reviewed
introduction lesson.

MVP-0 must eventually support:

1. a contextual learning objective;
2. comprehension and retrieval;
3. listening and speaking;
4. useful correction;
5. attempt and mistake memory;
6. FSRS-backed review planning;
7. a next lesson influenced by previous performance.

See [MVP-0](docs/mvp-0.md) and [architecture](docs/architecture.md) for the
contracts that guide implementation.

## Learner assumptions

- Spanish: A1, diagnosed as early/mid/strong A1 rather than assumed B1.
- English: B1 and used for concise scaffolding and explanations.
- Spanish variant: Spain Spanish, with regional differences mentioned only when
  useful.
- Learning priority: speaking, vocabulary, listening, then grammar.

## Technical direction

- Next.js + React + TypeScript
- Tailwind CSS
- modular monolith using Next.js server capabilities
- PostgreSQL + Drizzle ORM in the persistence slice
- `ts-fsrs` for spaced repetition
- provider boundaries for AI, speech recognition, and text-to-speech
- PWA/web first

## Local development

```bash
npm install
docker compose up -d
copy .env.example .env.local
npm run db:generate
npm run db:migrate
npm run dev
```

Then open `http://localhost:3000`.

Quality checks:

```bash
npm run lint
npm run test
npm run build
```

## Roadmap

1. Application shell and persistent learner profile. — implemented
2. Onboarding and initial text-based A1 diagnostic. — implemented
3. Learning items and FSRS. — implemented for the first lesson
4. Duration-aware lesson engine. — planning and persistence implemented
5. Listening and cached audio.
6. Microphone capture and speech transcription.
7. AI teacher behind a provider interface.
8. Structured long-term error memory.
9. Adaptive curriculum.
10. Progress and a non-punitive behavioral layer.

## Non-goals for MVP

Native mobile apps, social features, billing, leaderboards, multiple target
languages, a course marketplace, advanced pronunciation scoring, a custom LLM,
and microservices are intentionally excluded.
