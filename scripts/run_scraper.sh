#!/bin/bash
cd "$(dirname "$0")/.."
set -a
source .env.local
set +a
echo "[wrapper] Starting scraper with SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
npx tsx scripts/scraper.ts
