#!/usr/bin/env sh
set -eu

deploy_root=${1:-}
backup_path=${2:-}
confirmation=${3:-}

if [ "$confirmation" != "--confirm-replace" ]; then
  echo "Usage: pilot-remote-restore.sh <deploy-root> <backup.dump> --confirm-replace" >&2
  exit 2
fi
case "$deploy_root" in
  /*..*) echo "deploy root must not contain '..'" >&2; exit 2 ;;
  /*) ;;
  *) echo "deploy root must be an absolute path" >&2; exit 2 ;;
esac
case "$backup_path" in
  /*) ;;
  *) echo "backup path must be absolute" >&2; exit 2 ;;
esac
test -s "$backup_path"

current_dir=$(readlink -f "$deploy_root/current")
case "$current_dir" in
  "$deploy_root"/releases/*) ;;
  *) echo "Refusing untrusted current release path: $current_dir" >&2; exit 2 ;;
esac

cd "$current_dir"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
safety_backup="$deploy_root/backups/pre-restore-$timestamp.dump"
mkdir -p "$deploy_root/backups"
chmod 700 "$deploy_root/backups"

docker compose --env-file .env.pilot -f compose.pilot.yaml exec -T postgres \
  pg_dump --username=spanish_coach --dbname=spanish_coach --format=custom > "$safety_backup"
test -s "$safety_backup"
chmod 600 "$safety_backup"

docker compose --env-file .env.pilot -f compose.pilot.yaml stop app
if ! docker compose --env-file .env.pilot -f compose.pilot.yaml exec -T postgres \
  pg_restore --username=spanish_coach --dbname=spanish_coach --clean --if-exists \
    --no-owner --no-privileges --exit-on-error < "$backup_path"; then
  echo "Restore failed. The app remains stopped; safety backup: $safety_backup" >&2
  exit 1
fi

docker compose --env-file .env.pilot -f compose.pilot.yaml run --rm migrate
docker compose --env-file .env.pilot -f compose.pilot.yaml start app
app_port=$(sed -n 's/^APP_PORT=//p' .env.pilot | tail -n 1)
case "$app_port" in
  *[!0-9]*|'') echo "Invalid APP_PORT in .env.pilot; verify readiness manually." >&2; exit 1 ;;
esac
attempt=1
until curl --fail --silent --show-error "http://127.0.0.1:$app_port/api/health/ready" >/dev/null; do
  if [ "$attempt" -ge 30 ]; then
    echo "Restore completed, but the app did not become ready." >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 2
done
echo "Restored $backup_path; safety backup: $safety_backup"
