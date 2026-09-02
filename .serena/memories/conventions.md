---
name: conventions
description: Stable coding and repository conventions for Spanish Coach
---

- AGENTS.md (root) is the product contract: A1 es-ES target, English B1 support, speaking-first, non-punitive; ask before changing product goals, methodology, foundational data model, core UX, major dependencies, AI-provider strategy, cost model, or MVP scope.
- Layering: components (client) -> domain (pure TS) -> server/<area>/service (import "server-only") -> api routes (zod v4 parse, NextResponse.json). Services throw sentinel Error codes (e.g. LESSON_PLAN_UNAVAILABLE, ACTIVE_LESSON_EXISTS, LESSON_SESSION_NOT_ACTIVE); routes map codes to 400/404/409/503 user-facing messages.
- Observability: logInfo/logError (src/server/observability/logger.ts); src/instrumentation.ts register() + onRequestError; LOG_LEVEL debug|info|warn|error.
- Content provenance mandatory: every learning item carries sourceType, sourceReference, license, attribution, qaStatus (today: curated, Project-authored); NC/share-alike/unknown-terms data stays isolated until approved.
- Scheduling: ts-fsrs only (do not invent a scheduler); one FSRS card per learner+item in learner_item_states; per-modality evidence counters (recognition/recall/listening/production).
- No authentication (single-user by design); browser localStorage holds learner id(s) only; keys prefixed spanish-coach:*.
- TS strict, jsx react-jsx, LF line endings for source files (.serena/project.yml).
- Non-standard Next 16: consult node_modules/next/dist/docs/ before writing code (repo AGENTS.md rule).
- No pronunciation scoring from transcription alone (AGENTS.md).

## Verification
- Last verified: 2026-09-02
- Scope: AGENTS.md, src layering (components/domain/server/api samples), error-code handling in src/app/api/lesson/sessions/route.ts, logger/instrumentation, .serena/project.yml
- Evidence: `AGENTS.md`, `src/app/api/lesson/sessions/route.ts`, `src/server/observability/logger.ts`, `src/domain/lesson.ts`
- Unknown: conventions inferred from sampled files, not an exhaustive audit of every file
