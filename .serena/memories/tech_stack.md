---
name: tech_stack
description: Languages, frameworks, runtimes, packages, and build systems actually in use
---

- Node >=22 (package.json engines); CI Node 22; Dockerfile node:22-alpine.
- Next.js 16.3.2 installed (package.json ^16.0.0). Non-standard Next version: read node_modules/next/dist/docs/ before writing code (repo AGENTS.md rule). next.config.ts: output "standalone", reactStrictMode, deploymentId from DEPLOYMENT_VERSION.
- React 19.2, TypeScript 5.9 strict, moduleResolution bundler, path alias @/* -> ./src/*.
- Tailwind CSS v4 via @tailwindcss/postcss (postcss.config.mjs); src/app/globals.css.
- ESLint 9 flat config (eslint.config.mjs): eslint-config-next vitals + typescript.
- App router only: src/app/{layout,page}.tsx + src/app/api/**/route.ts; no server actions, no middleware.
- PostgreSQL 17 (compose.yaml: postgres:17-alpine, spanish_coach/spanish_coach).
- Drizzle ORM ^0.45.2 + drizzle-kit ^0.31 (drizzle.config.ts: schema ./src/server/db/schema.ts, out ./drizzle); postgres ^3.4.9 driver.
- zod ^4.4.3: env validation (src/server/config/environment.ts) and route input.
- ts-fsrs ^5.4.1: only consumer is src/server/review/scheduler.ts.
- Tests: vitest ^3.2 (npm run test excludes tests/e2e); @playwright/test ^1.62 chromium-only, workers 1, webServer dev port 3200 (playwright.config.ts); specs in tests/e2e.
- Smoke: scripts/smoke-test.mjs (env SMOKE_BASE_URL, SMOKE_EXPECTED_VERSION).
- Docker: multi-stage (base/dependencies/builder/migrator/runner), standalone server.js, healthcheck /api/health/ready; compose.yaml local postgres; compose.pilot.yaml pilot.
- GitHub Actions: ci.yml, deploy-pilot.yml (manual workflow_dispatch, env pilot-deploy), backup-pilot.yml.
- PWA: public/manifest.webmanifest (standalone).
- Env var names (values live in .env.example / .env.pilot.example): DATABASE_URL, APP_VERSION, DEPLOYMENT_VERSION, LOG_LEVEL, PIPER_EXECUTABLE, PIPER_MODEL_PATH, PIPER_MODEL_CONFIG_PATH, PIPER_VOICE_ID, TTS_CACHE_DIR; pilot: POSTGRES_PASSWORD, APP_PORT, PILOT_VERSION.

## Verification
- Last verified: 2026-09-02
- Scope: package.json, node_modules/next/package.json, next.config.ts, tsconfig.json, drizzle.config.ts, eslint/postcss configs, compose/Dockerfile/CI, playwright.config.ts, .env.example names
- Evidence: `package.json`, `node_modules/next/package.json`, `src/server/config/environment.ts`, `.github/workflows/ci.yml`
- Unknown: exact patch versions beyond next 16.3.2 and ts-fsrs 5.4.1; runtime provider behavior (piper sidecar) not exercised
