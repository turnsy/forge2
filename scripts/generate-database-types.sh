#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUTPUT="forge-next/lib/database.types.ts"
PROJECT_ID="xidptatroxjiqoyvhnzi"

if docker info >/dev/null 2>&1; then
  npx supabase@latest db start
  npx supabase@latest gen types typescript --local \
    | node scripts/format-database-types.mjs "$OUTPUT"
  exit 0
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Docker is unavailable and SUPABASE_ACCESS_TOKEN is not set." >&2
  echo "Run with Docker for local generation, or set SUPABASE_ACCESS_TOKEN for remote generation." >&2
  exit 1
fi

npx supabase@latest gen types typescript --project-id "$PROJECT_ID" \
  | node scripts/format-database-types.mjs "$OUTPUT"
