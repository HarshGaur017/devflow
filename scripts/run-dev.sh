#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Starting Postgres + Redis (docker-compose)..."
docker compose up -d postgres redis

echo "==> Waiting for API (port 3001) and web (port 3000)..."

cleanup() {
  echo
  echo "==> Stopping dev servers..."
  kill "${DEV_PID:-}" 2>/dev/null || true
  wait "${DEV_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

pnpm dev &
DEV_PID=$!

wait_for() {
  local url="$1" label="$2" tries=60
  until curl -sf "$url" >/dev/null 2>&1; do
    tries=$((tries - 1))
    if [ "$tries" -le 0 ]; then
      echo "$label did not come up in time — check the logs above."
      exit 1
    fi
    sleep 1
  done
}

wait_for "http://localhost:3001/health" "API (:3001)"
wait_for "http://localhost:3000" "Web (:3000)"

echo "==> Both servers are up. Opening http://localhost:3000 ..."
open "http://localhost:3000" 2>/dev/null || true

cat <<'EOF'

==================================================================
Manual test checklist:

1. You should land on /login (redirected automatically from /).
2. Click "Continue with GitHub" -> authorize on GitHub's consent
   screen (only needed once, or if you've revoked the app before).
3. You should land back on /dashboard with your real profile,
   repos, pull requests, review requests, and recent commits.
4. Reload /dashboard directly -> should stay logged in (no bounce
   to /login).
5. Shrink the window to mobile width -> sidebar should collapse
   into a hamburger-triggered drawer.
6. Click "Log out" in the sidebar -> should land on /login, and
   reloading /dashboard afterwards should bounce you back to
   /login.

Press Ctrl+C here when you're done to stop both dev servers.
==================================================================
EOF

wait "$DEV_PID"
