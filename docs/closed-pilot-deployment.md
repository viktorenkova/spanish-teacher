# Closed pilot deployment

## Boundary

The pilot package is provider-neutral and runs on any host with Docker Compose.
It deliberately publishes the application only on `127.0.0.1`. PostgreSQL has
no host port. This is a closed-pilot boundary, not public authentication.

Do not change the binding to `0.0.0.0` until a TLS-terminating access gateway or
reverse proxy protects the application. The gateway must provide pilot-user
access control, request-size limits, rate limiting, and access logs. Application
authentication remains outside MVP-0 and requires a separate product decision.

## Prepare the host

Requirements:

- a current Docker Engine with the Compose plugin;
- enough persistent disk for PostgreSQL and backups;
- outbound image-registry access during the first build;
- an operator account that can run Docker but is not shared with learners.

Create the runtime environment:

```bash
cp .env.pilot.example .env.pilot
chmod 600 .env.pilot
```

Replace `POSTGRES_PASSWORD` with a long URL-safe random value and set
`PILOT_VERSION` to the deployed commit SHA or release tag. The password is used
both by PostgreSQL and inside its connection URL, so characters that require URL
encoding must not be used in this file.

Validate without starting anything:

```bash
docker compose --env-file .env.pilot -f compose.pilot.yaml config --quiet
```

## Start or update

```bash
docker compose --env-file .env.pilot -f compose.pilot.yaml up --build --detach
docker compose --env-file .env.pilot -f compose.pilot.yaml ps
```

Compose waits for PostgreSQL, runs the versioned Drizzle migrations once, and
only then starts the non-root Next.js container. Container logs rotate at 10 MB
with three retained files. Next.js receives a 30-second graceful-stop window.

Verify the exact deployed bundle:

```bash
SMOKE_BASE_URL=http://127.0.0.1:3000 npm run test:smoke
```

For operator-only access from another computer, keep the loopback binding and
use an SSH tunnel:

```bash
ssh -L 3000:127.0.0.1:3000 operator@pilot-host
```

Then open `http://127.0.0.1:3000` locally.

## Backups

Create a PostgreSQL custom-format backup while the pilot is running:

```bash
npm run pilot:backup
```

Use `-- --output /secure/off-host/path` to change the destination, or
`-- --env-file another.env` for a differently named environment file. The
default `.backups` directory is ignored by Git. Copy backups off the Docker host
and periodically test restoration in a disposable environment.

Restoration replaces the current database. It stops the app, restores the dump,
and starts the app again only when the explicit confirmation flag is present:

```bash
npm run pilot:restore -- .backups/spanish-coach-TIMESTAMP.dump --confirm-replace
npm run test:smoke
```

Take a fresh backup before every restore or schema-changing update.

## Operations

Useful read-only checks:

```bash
docker compose --env-file .env.pilot -f compose.pilot.yaml ps
docker compose --env-file .env.pilot -f compose.pilot.yaml logs --tail 200 app
curl --fail http://127.0.0.1:3000/api/health/live
curl --fail http://127.0.0.1:3000/api/health/ready
```

If an update fails, preserve the database volume, build the last known-good
source revision as a separate release, and run the smoke test before directing
pilot traffic back to it. Do not delete volumes as part of an application
rollback.

## Still requires a hosting decision

The package does not create billable infrastructure. Before public or broader
pilot use, select the host and access gateway, configure TLS and DNS, schedule
off-host encrypted backups, define retention and restore objectives, and add a
remote post-deploy smoke step using the platform's secret store.
