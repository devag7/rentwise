# RentWise

Rental listings platform for Bangalore. Next.js 16 App Router + Supabase (auth, Postgres, RLS, realtime) + Mapbox. Data pipeline scrapes MagicBricks (cheerio/axios) and NoBroker (Apify actor) into the `properties` table.

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build (standalone output)
npm run lint         # eslint (flat config)
npm run typecheck    # tsc --noEmit
npm run test:e2e     # playwright smoke suite (defaults to live droplet URL)
npm run scrape       # one-off Apify NoBroker sync
```

E2E against local build: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`.

## Architecture

- `src/app/` — App Router pages. No API routes except `api/health`; pages talk to Supabase directly via `@supabase/ssr` clients in `src/utils/supabase/` (client/server/middleware variants).
- `src/middleware.ts` — refreshes Supabase session cookies on every request.
- Roles: `tenant` and `landlord`, stored in `user_metadata.role`; separate login/register pages per role. Access control is enforced by Supabase RLS policies (see `db/migrations/`), not app code.
- `scripts/` — scraper pipeline. `cron.ts` runs inside the same Docker container as the web server (started by `scripts/entrypoint.sh`), scheduled 06:00 & 18:00 IST. Zero-fake-data policy: scrapers never invent field values.
- `src/utils/analytics.ts` — first-party event tracking into `analytics_events` table (RLS: insert-only for clients). Fire-and-forget; must never throw.

## Deploy

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`): CI (lint/typecheck/build) → SSH to DigitalOcean droplet (`/var/www/rentwise`) → `docker-compose up -d --build` → Playwright smoke tests against http://157.245.110.163:3009. The droplet's `.env` supplies all secrets/build args; CI builds with placeholders.

## Constraints

- ESLint is pinned to v9: `eslint-plugin-react` (via eslint-config-next) breaks on ESLint 10.
- React Compiler lint (`react-hooks/set-state-in-effect`) is enforced — don't call setState-bearing callbacks synchronously in effects; use `.then()` chains or subscription callbacks.
- Listing images come from arbitrary scraped hosts — use `<img>`, not `next/image` (rule disabled in eslint config).
- DB schema changes go in `db/migrations/supabase_migration_phaseN_*.sql` and must be applied manually in the Supabase SQL editor.
