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

## Remote closed-pilot delivery

The `Deploy closed pilot` workflow packages an immutable Git revision, sends it
to one Linux host over pinned SSH, writes the runtime environment with mode
`0600`, takes a pre-deploy database backup, activates the Compose release, and
checks the exact deployed version through an SSH tunnel. It deliberately keeps
the web port on host loopback; TLS and application authentication are therefore
not required for this SSH-only pilot boundary.

Prepare an unprivileged operator account on the host. It must be able to run
Docker and own the deployment root, but it must not have a shared password:

```bash
sudo install -d -o pilot -g pilot -m 0750 /opt/spanish-coach
```

Create a protected GitHub environment named `pilot-deploy` and require reviewer
approval for deployments. Create a separate `pilot-backup` environment without
a reviewer gate so scheduled backups can run unattended. Configure these shared
secrets in both environments:

- `PILOT_HOST`: DNS name or IPv4 address of the host;
- `PILOT_USER`: the dedicated SSH user (`pilot` in the example);
- `PILOT_SSH_PRIVATE_KEY`: its private deployment key;
- `PILOT_HOST_KEY`: a previously verified `known_hosts` line, not an unchecked
  value collected inside the workflow.

Set `POSTGRES_PASSWORD` (at least 32 URL-safe characters) only in
`pilot-deploy`. Set `PILOT_BACKUP_AGE_RECIPIENT` only in `pilot-backup`; it is
the public `age1...` recipient whose private key is stored outside GitHub and
outside the pilot host.

Optional GitHub configuration variables are `PILOT_DEPLOY_ROOT` (default
`/opt/spanish-coach`), `PILOT_APP_PORT` (default `3000`), and
`PILOT_BACKUPS_ENABLED`. If the deployment root is changed, set it identically
in both environments. Configure the enable switch as a repository variable
because it gates the scheduled job before the environment starts. Set it to
`true` only after a manual backup and restore drill succeeds. The scheduled
workflow then streams a PostgreSQL custom archive away from the host, validates
it, encrypts it with `age`, and retains only the encrypted artifact for 14 days.

Trigger `Deploy closed pilot` manually and select an audited Git ref. A failed
readiness check does not move the `current` symlink. Inspect the job diagnostics
before retrying; schema-changing rollbacks require an explicit restore decision.

Learners connect through an individually assigned SSH account or an
operator-managed tunnel:

```bash
ssh -N -L 3000:127.0.0.1:3000 learner@pilot-host
```

Do not grant learners Docker access or access to the deployment account.

## Restore an encrypted off-host backup

Download the workflow artifact to an operator machine, verify its checksum, and
decrypt it with the separately held age identity:

```bash
sha256sum --check spanish-coach-TIMESTAMP.dump.age.sha256
age --decrypt --identity /secure/path/pilot-backup.agekey \
  --output spanish-coach-TIMESTAMP.dump spanish-coach-TIMESTAMP.dump.age
scp spanish-coach-TIMESTAMP.dump pilot@pilot-host:/opt/spanish-coach/restore.dump
```

On the host, inspect the archive with `pg_restore --list`, take the pilot out of
use, and invoke the guarded restore. The script creates a second safety backup,
stops the app, restores the database, reapplies current migrations, and starts
the app only after success:

```bash
sh /opt/spanish-coach/current/scripts/pilot-remote-restore.sh \
  /opt/spanish-coach /opt/spanish-coach/restore.dump --confirm-replace
curl --fail http://127.0.0.1:3000/api/health/ready
```

Delete the decrypted local and remote dumps after the drill. Keep the age
identity offline and test restore at least once before inviting learners.

## Before broader or public access

The automation does not create billable infrastructure or expose the app to the
internet. Broader access still requires an explicit choice of host and access
gateway, TLS and DNS, request limits, access logs, backup retention objectives,
and an application-authentication product decision.
