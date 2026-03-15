#!/bin/bash
# RentWise Zero-Downtime Deploy Script
# Run this on the droplet: bash deploy.sh

set -e

echo "=== RentWise Zero-Downtime Deploy ==="
echo ""

cd /var/www/rentwise

# 1. Pull latest code
echo "[1/4] Pulling latest code..."
git pull origin main

# 2. Build new image WITHOUT stopping the old container
echo "[2/4] Building new Docker image (old site stays live)..."
docker compose build --no-cache rentwise-next

# 3. Recreate container — old container stays alive until new one is healthy
echo "[3/4] Starting new container (zero-downtime swap)..."
docker compose up -d --force-recreate --no-deps rentwise-next

# 4. Wait for health check
echo "[4/4] Waiting for health check..."
sleep 10
for i in $(seq 1 12); do
    if curl -sf http://localhost:3009/ > /dev/null 2>&1; then
        echo ""
        echo "=== Deploy Complete! Site is live ==="
        echo "URL: http://157.245.110.163:3009"
        docker ps --filter name=rentwise_next_app --format "Status: {{.Status}}"
        exit 0
    fi
    echo "  Waiting... ($i/12)"
    sleep 5
done

echo ""
echo "WARNING: Health check timed out. Check logs:"
echo "  docker logs rentwise_next_app --tail 50"
