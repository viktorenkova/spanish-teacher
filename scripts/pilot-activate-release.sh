#!/usr/bin/env sh
set -eu

deploy_root=${1:-}
release_id=${2:-}
app_port=${3:-}

case "$deploy_root" in
  /*..*) echo "deploy root must not contain '..'" >&2; exit 2 ;;
  /*) ;;
  *) echo "deploy root must be an absolute path" >&2; exit 2 ;;
esac
case "$release_id" in
  *[!0-9a-f]*|'') echo "release id must be a lowercase Git SHA" >&2; exit 2 ;;
esac
[ "${#release_id}" -eq 40 ] || { echo "release id must contain 40 characters" >&2; exit 2; }
case "$app_port" in
  *[!0-9]*|'') echo "app port must be numeric" >&2; exit 2 ;;
esac
[ "${#app_port}" -le 5 ] && [ "$app_port" -ge 1 ] && [ "$app_port" -le 65535 ] \
  || { echo "app port must be between 1 and 65535" >&2; exit 2; }

release_dir="$deploy_root/releases/$release_id"
env_file="$release_dir/.env.pilot"
compose_file="$release_dir/compose.pilot.yaml"
backup_dir="$deploy_root/backups"

test -f "$env_file"
test -f "$compose_file"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"

if current_dir=$(readlink -f "$deploy_root/current" 2>/dev/null); then
  case "$current_dir" in
    "$deploy_root"/releases/*)
      if [ -f "$current_dir/compose.pilot.yaml" ] && [ -f "$current_dir/.env.pilot" ]; then
        timestamp=$(date -u +%Y%m%dT%H%M%SZ)
        backup_path="$backup_dir/pre-deploy-$release_id-$timestamp.dump"
        (
          cd "$current_dir"
          docker compose --env-file .env.pilot -f compose.pilot.yaml exec -T postgres \
            pg_dump --username=spanish_coach --dbname=spanish_coach --format=custom
        ) > "$backup_path"
        test -s "$backup_path"
        chmod 600 "$backup_path"
        echo "Created pre-deploy backup: $backup_path"
      fi
      ;;
    *) echo "Refusing untrusted current release path: $current_dir" >&2; exit 2 ;;
  esac
fi

cd "$release_dir"
docker compose --env-file "$env_file" -f "$compose_file" config --quiet
docker compose --env-file "$env_file" -f "$compose_file" up --build --detach

attempt=1
until curl --fail --silent --show-error "http://127.0.0.1:$app_port/api/health/ready" >/dev/null; do
  if [ "$attempt" -ge 30 ]; then
    docker compose --env-file "$env_file" -f "$compose_file" logs --tail 200 app migrate >&2
    echo "Release failed its readiness check; current symlink was not changed." >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 2
done

ln -sfn "$release_dir" "$deploy_root/current"
echo "Activated release $release_id"
