---
name: suggested_commands
description: Verified local commands for setup, build, test, lint, and pilot operations
---

Setup:
- npm install
- docker compose up -d   # postgres:17-alpine (spanish_coach/spanish_coach)
- copy .env.example .env.local
- npm run db:generate && npm run db:migrate
- npm run dev           # http://localhost:3000

Quality:
- npm run lint          # eslint .
- npm run test          # vitest unit (excludes tests/e2e)
- npm run build         # next build, standalone output
- npx playwright install chromium
- npm run test:e2e      # auto-starts dev server on port 3200
- npm run test:smoke    # needs a running server; SMOKE_BASE_URL, SMOKE_EXPECTED_VERSION

Pilot/release ops:
- docker compose -f compose.pilot.yaml config   # CI validates this
- node scripts/pilot-docker.mjs                 # container lifecycle
- node scripts/pilot-backup.mjs / pilot-restore.mjs
- node scripts/pilot-learning-report.mjs / pilot-feedback-report.mjs
- bash scripts/pilot-activate-release.sh / pilot-remote-restore.sh (remote pilot)

CI gate order (ci.yml): lint -> unit -> db:migrate -> build -> e2e -> compose validate -> docker build --target runner -> container smoke (127.0.0.1:3100).

## Verification
- Last verified: 2026-09-02
- Scope: script names and invocations read from package.json, README, playwright.config.ts, ci.yml, Dockerfile (static, not executed in this session)
- Evidence: `package.json`, `README.md`, `.github/workflows/ci.yml`, `playwright.config.ts`
- Unknown: no command was executed in the onboarding session; current pass/fail state of suites unknown
