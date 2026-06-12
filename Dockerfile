# --- Stage 1: Build Image ---
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies (reproducible via lockfile)
COPY package.json package-lock.json ./
RUN npm ci

# Copy full source and build application
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_MAPBOX_TOKEN

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

RUN npm run build

# Drop dev-only packages so the runner stage copies a lean node_modules
# (tsx + scraper deps live in "dependencies" and survive the prune)
RUN npm prune --omit=dev

# --- Stage 2: Production Image ---
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy Next.js standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy scraper scripts + pruned node_modules for the cron process
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy entrypoint script
COPY --from=builder /app/scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

# Start both Next.js server AND cron scraper
CMD ["./entrypoint.sh"]
