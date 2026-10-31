#!/usr/bin/env bash
set -Eeuo pipefail

commit_sha="${1:-}"

if [[ ! "$commit_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "A full 40-character Git commit SHA is required." >&2
  exit 2
fi

app_root="/home/koi-erp"
release="$app_root/releases/${commit_sha:0:7}-$(date +%Y%m%d-%H%M%S)"
current="$app_root/current"
repository="https://github.com/Saurabh19F/KOI_EPR.git"

echo "Preparing release $release"
git init "$release"
cd "$release"
git remote add origin "$repository"
git fetch --depth 1 origin "$commit_sha"
git checkout --detach FETCH_HEAD

deployed_sha="$(git rev-parse HEAD)"
if [[ "$deployed_sha" != "$commit_sha" ]]; then
  echo "Expected $commit_sha but cloned $deployed_sha." >&2
  exit 3
fi

install -m 600 "$app_root/shared/api.env" apps/api/.env
install -m 600 "$app_root/shared/web.env" apps/web/.env.local
install -m 600 "$app_root/shared/web.env" apps/web/.env.production

npm ci
npm run build --workspace=apps/api
npm run build --workspace=apps/web

previous_release="$(readlink -f "$current")"

start_release() {
  local target="$1"

  pm2 delete koi-erp-api koi-erp-web >/dev/null 2>&1 || true

  cd "$target/apps/api"
  pm2 start dist/src/main.js --name koi-erp-api --update-env

  cd "$target/apps/web"
  PORT=3020 pm2 start npm --name koi-erp-web -- start -- -p 3020
}

rollback() {
  local exit_code=$?
  trap - ERR

  echo "Deployment failed; rolling back to $previous_release." >&2
  ln -sfn "$previous_release" "$current"
  start_release "$previous_release"
  pm2 save
  exit "$exit_code"
}

trap rollback ERR

ln -sfn "$release" "$current"
start_release "$release"

api_ready=0
web_ready=0

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3021/api/v1/health >/tmp/koi-api-health.json; then
    api_ready=1
  fi

  if curl -fsSI http://127.0.0.1:3020/login >/tmp/koi-web-health.txt; then
    web_ready=1
  fi

  if [[ "$api_ready" -eq 1 && "$web_ready" -eq 1 ]]; then
    break
  fi

  sleep 2
done

[[ "$api_ready" -eq 1 ]]
[[ "$web_ready" -eq 1 ]]

curl -fsS https://automationbysj.site/api/v1/health >/tmp/koi-public-health.json
curl -fsSI https://automationbysj.site/login >/tmp/koi-public-login.txt

pm2 save
trap - ERR

echo "Production now runs $commit_sha from $release."
cat /tmp/koi-public-health.json
