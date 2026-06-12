#!/bin/sh

echo "[ENTRYPOINT] Starting RentWise services..."

# Start the cron scraper in background, restarting it if it ever crashes
# so a scraper failure can't permanently disable scheduled syncs.
echo "[ENTRYPOINT] Starting cron scraper (supervised)..."
(
  while true; do
    npx tsx scripts/cron.ts
    echo "[ENTRYPOINT] Cron scraper exited (code $?). Restarting in 60s..."
    sleep 60
  done
) &

# Start Next.js server (foreground - keeps container alive)
echo "[ENTRYPOINT] Starting Next.js server on port 3000..."
exec node server.js
