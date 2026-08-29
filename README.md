# Spanish Coach

Spanish Coach is a web-first adaptive teacher for a learner whose Spanish is
currently **A1** and whose support language, English, is **B1**. The default
target is Spain Spanish (`es-ES`).

The product leads the learner through short sessions combining speaking,
vocabulary, listening, and practical grammar. It remembers what the learner
knows, schedules useful retrieval, and brings meaningful mistakes back in later
lessons.

## Current milestone

The repository is implementing MVP-0: a coherent A1 learning loop across the
three initial curriculum topics. The current slice includes persistent
profiles, an A1 diagnostic, FSRS review state, listening, a transcript-backed
spoken task in every lesson, persisted provider-based teacher feedback,
structured long-term mistake memory, executable adaptive reviews, and
learner-facing progress. Active lesson sessions are persisted separately and
resume at the first incomplete exercise after a reload. The release-hardening
slice also supports explicit safe interruption and covers the complete adaptive
learning loop plus mobile accessibility in Chromium.

MVP-0 must eventually support:

1. a contextual learning objective;
2. comprehension and retrieval;
3. listening and speaking;
4. useful correction;
5. attempt and mistake memory;
6. FSRS-backed review planning;
7. a next lesson influenced by previous performance.

See [MVP-0](docs/mvp-0.md), [adaptive curriculum](docs/adaptive-curriculum.md),
[lesson sessions](docs/lesson-sessions.md), and
[architecture](docs/architecture.md) for the contracts that guide implementation.
Production checks and runtime contracts are documented in
[production readiness](docs/production-readiness.md). The provider-neutral
container and backup runbook are in
[closed pilot deployment](docs/closed-pilot-deployment.md).

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
npx playwright install chromium
npm run test:e2e
# With the production server running:
npm run test:smoke
```

## Roadmap

1. Application shell and persistent learner profile. — implemented
2. Onboarding and initial text-based A1 diagnostic. — implemented
3. Learning items and FSRS. — implemented for the first lesson
4. Duration-aware lesson engine. — planning and persistence implemented
5. Listening and cached audio. — first `es-ES` exercise and provider boundary implemented
6. Microphone capture and speech transcription. — browser `es-ES` provider implemented
7. AI teacher behind a provider interface. — structured contract and local teacher implemented
8. Structured long-term error memory. — aggregate states and event history implemented
9. Adaptive curriculum. — the three initial topics and executable FSRS/mistake reviews are implemented
10. Progress and a non-punitive behavioral layer. — first learner-facing progress summary implemented
11. Persistent lesson sessions and browser E2E coverage. — implemented for the MVP learning loop
12. MVP-0 release hardening. — full-loop/adaptive E2E, safe interruption, and mobile accessibility implemented
13. Production readiness. — validated runtime configuration, health checks, structured logs, CI, and smoke testing implemented
14. Closed-pilot deployment package. — localhost-only standalone container, migration job, backups, and container smoke implemented
15. Remote closed-pilot operations. — pinned-SSH deploy, exact-version smoke check, encrypted off-host backups, and guarded remote restore implemented
16. Pilot feedback UX hardening. — user-paced feedback, explicit lesson completion, and manual microphone stop implemented
17. Closed-pilot feedback collection. — per-session usability feedback, saved confirmation, and an operator report implemented

## Non-goals for MVP

Native mobile apps, social features, billing, leaderboards, multiple target
languages, a course marketplace, advanced pronunciation scoring, a custom LLM,
and microservices are intentionally excluded.
