# --- Stage 1: Build Image ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy full source and build application
COPY . .
# We need environment variables at build time if deploying directly, 
# but normally injecting them at runtime in docker-compose is fine since we aren't using static rendering that relies on them.
RUN npm run build

# --- Stage 2: Production Image ---
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Start server node instance on port 3000 (We map to 3009 externally)
EXPOSE 3000
CMD ["node", "server.js"]
