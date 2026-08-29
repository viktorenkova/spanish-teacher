# Production readiness

## Runtime configuration

Server configuration is parsed and validated when a Node.js server instance
starts. Validation errors name the invalid variable without printing its value.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection using `postgres://` or `postgresql://`. |
| `APP_VERSION` | no | Version exposed by health responses and logs; defaults to `development`. |
| `DEPLOYMENT_VERSION` | no | Next.js deployment ID used for rolling-deployment skew protection. |
| `LOG_LEVEL` | no | `debug`, `info`, `warn`, or `error`; defaults to `info`. |
| `PIPER_EXECUTABLE` and `PIPER_MODEL_PATH` | together | Enable local server-side Piper audio. |
| `PIPER_MODEL_CONFIG_PATH` | no | Optional Piper model configuration. |
| `PIPER_VOICE_ID` | no | Stable voice identity written to cached audio metadata. |
| `TTS_CACHE_DIR` | no | Local cache location; defaults to `.data/tts-cache`. |

Do not prefix server secrets with `NEXT_PUBLIC_`; Next.js would expose those
values to browser bundles.

## Health contract

- `GET /api/health/live` returns `200` when the Next.js process can serve a
  request. It does not depend on PostgreSQL.
- `GET /api/health/ready` runs a small PostgreSQL query. It returns `200` with
  `status: ready`, or `503` with `status: unavailable`.
- Both responses use `Cache-Control: no-store` and expose only service name,
  application version, status, and timing metadata. They never expose the
  database URL.

A platform should use `live` to decide whether to restart a process and `ready`
to decide whether to send learner traffic to it.

## Structured logs

Server lifecycle and unexpected API errors are emitted as one JSON object per
line. Records include timestamp, severity, service, version, event name, and
safe route context. PostgreSQL credentials are redacted from error messages and
stack traces. Expected validation and domain `4xx` responses are not logged as
server failures.

## Verification

The GitHub Actions workflow starts PostgreSQL, installs locked dependencies,
runs lint and unit tests, applies migrations, builds the production bundle,
runs Playwright, and then starts `next start` on port 3100 for a smoke test.

To smoke-test an already running deployment:

```bash
SMOKE_BASE_URL=https://example.com npm run test:smoke
```

On PowerShell:

```powershell
$env:SMOKE_BASE_URL = "https://example.com"
npm.cmd run test:smoke
```

The actual hosting platform, domain, TLS termination, secret store, backup
policy, and reverse-proxy/rate-limit configuration remain deployment choices.
The portable localhost-only deployment package and operator runbook are in
[closed pilot deployment](closed-pilot-deployment.md).
