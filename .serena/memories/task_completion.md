---
name: task_completion
description: Verified completion checks, CI gates, and release expectations
---

- A feature is done when: the UI path works, important edge cases are handled, relevant tests pass, and it improves usable Spanish (AGENTS.md).
- Per-change checks: npm run lint; npm run test; npm run build; E2E (npm run test:e2e) for UI-path changes; npm run test:smoke against a running server for release-like validation.
- CI (ci.yml; push master/main + PR): Node 22, postgres:17 service; lint -> unit -> db:migrate -> build -> Playwright e2e -> docker compose -f compose.pilot.yaml config --quiet -> docker build --target runner -> container smoke on 127.0.0.1:3100 with SMOKE_EXPECTED_VERSION; failure artifacts .logs, test-results, playwright-report.
- Release (closed pilot): manual .github/workflows/deploy-pilot.yml (workflow_dispatch release_ref, environment pilot-deploy, secrets PILOT_HOST/PILOT_USER/PILOT_SSH_PRIVATE_KEY/PILOT_HOST_KEY/POSTGRES_PASSWORD); scripts/pilot-activate-release.sh, scripts/pilot-remote-restore.sh; encrypted off-host backups (*.dump.age, pilot-backup.mjs/pilot-restore.mjs); backup-pilot.yml.
- Version gates: APP_VERSION and DEPLOYMENT_VERSION env (next.config.ts deploymentId); smoke asserts SMOKE_EXPECTED_VERSION.
- Migrations: Drizzle committed in drizzle/ (0000..0007 + meta snapshots); schema source src/server/db/schema.ts; npm run db:migrate before running.

## Verification
- Last verified: 2026-09-02
- Scope: AGENTS.md completion rule, ci.yml, deploy-pilot.yml (head), Dockerfile, scripts/, drizzle/ listing, next.config.ts
- Evidence: `AGENTS.md`, `.github/workflows/ci.yml`, `.github/workflows/deploy-pilot.yml`, `drizzle/0000..0007`
- Unknown: no suite was executed in this session; remote pilot host state and backup retention are outside local verification
