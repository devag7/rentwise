#!/bin/sh

echo "[ENTRYPOINT] Starting RentWise services..."

# Start the cron scraper in background
echo "[ENTRYPOINT] Starting cron scraper..."
npx tsx scripts/cron.ts &

# Start Next.js server (foreground - keeps container alive)
echo "[ENTRYPOINT] Starting Next.js server on port 3000..."
node server.js
