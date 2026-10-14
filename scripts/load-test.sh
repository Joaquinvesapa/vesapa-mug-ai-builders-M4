#!/usr/bin/env bash
# Reproducible load tests of RNF-01 / RNF-03 (k6 in Docker) against an isolated stack with
# throwaway credentials; everything is removed at the end. SKIP_BUILD=1 reuses .next.
set -euo pipefail
cd "$(dirname "$0")/.."

export LOAD_APP_DIR="$PWD"
export LOAD_DB_PORT="${LOAD_DB_PORT:-55440}"
export LOAD_DB_PASSWORD="$(openssl rand -hex 16)"
export LOAD_AUTH_SECRET="$(openssl rand -hex 32)"
compose=(docker compose -f tests/load/compose.yaml)

cleanup() { "${compose[@]}" --profile k6 down -v --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

[ "${SKIP_BUILD:-0}" = 1 ] || npm run build
mkdir -p tests/load/results

"${compose[@]}" up -d --wait db
export DATABASE_URL="postgresql://load:${LOAD_DB_PASSWORD}@127.0.0.1:${LOAD_DB_PORT}/load"
npx prisma migrate deploy
npx tsx scripts/seed-perf.mts tests/load/results/fixture.json
"${compose[@]}" up -d --wait app

status=0
for suite in ${LOAD_SUITES:-queries export}; do
  echo "== k6: ${suite}"
  "${compose[@]}" run --rm -e QUERY_P95_MS -e EXPORT_P95_MS k6 run --quiet "/scripts/${suite}.js" \
    | tee "tests/load/results/${suite}.txt" || status=1
done
exit "$status"
