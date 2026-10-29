# RentWise

Rental listings platform for Bangalore. Next.js 16 App Router on Vercel + Supabase (auth, Postgres, RLS, realtime, Storage, Edge Functions, pg_cron) + Mapbox. Edge Functions pull NoBroker and MagicBricks listings through Apify actors into the `properties` table (MagicBricks blocks cloud IPs, so no direct scraping). Production: https://rentwise.devshipit.com

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build (standalone output)
npm run lint         # eslint (flat config)
npm run typecheck    # tsc --noEmit
npm run test:e2e     # playwright smoke suite (defaults to production URL)
npm run scrape       # one-off Apify NoBroker sync
```

E2E against local build: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`.

## Architecture

- `src/app/` — App Router pages. API routes: `api/health`, `api/check-rent` (fallback for the `check-rent` Edge Function). Public pages read through the cookie-less `createPublicClient()` (`src/utils/supabase/public.ts`) so they can be ISR-cached; auth-bound code uses the `@supabase/ssr` client/server variants.
- `src/proxy.ts` — refreshes Supabase session cookies, but only when an `sb-*-auth-token` cookie exists (anonymous traffic skips the Auth round trip).
- Market stats live in Postgres views (`market_stats`, `paid_rent_stats`, `listing_report_counts`); `src/utils/market.ts#getMarketStats` reads them and falls back to computing in JS if the view is missing. Only `is_active` listings count; `src/utils/listings.ts#queryActive` retries without that filter on pre-phase-15 databases.
- `supabase/functions/` — Deno Edge Functions (sync-nobroker, sync-magicbricks, send-alerts, check-rent), scheduled by pg_cron (`db/migrations/..._phase16_schedules.sql`). Excluded from the Next tsconfig/eslint. Deploy: `supabase/README.md`.
- Roles: `tenant` and `landlord`, stored in `user_metadata.role`; separate login/register pages per role. Access control is enforced by Supabase RLS policies (see `db/migrations/`), not app code.
- `scripts/` — legacy Docker scraper pipeline (droplet only). Zero-fake-data policy everywhere: never invent field values (no default BHK/size), never store scraped owner names/phones, never show a verdict/number without ≥3 real comps.
- `src/utils/analytics.ts` — first-party event tracking into `analytics_events` table (RLS: insert-only for clients). Fire-and-forget; must never throw.

## Deploy

Vercel project `rentwise` (Git-connected) deploys every push; `main` → production at rentwise.devshipit.com (Cloudflare DNS CNAME → Vercel). Env vars live in Vercel. `.github/workflows/smoke-vercel.yml` runs the Playwright suite on each successful Vercel deployment. `deploy.yml` runs CI (lint/typecheck/build); its legacy droplet jobs only run if repo variable `DEPLOY_DROPLET=true`.

## Constraints

- ESLint is pinned to v9: `eslint-plugin-react` (via eslint-config-next) breaks on ESLint 10.
- React Compiler lint (`react-hooks/set-state-in-effect`) is enforced — don't call setState-bearing callbacks synchronously in effects; use `.then()` chains or subscription callbacks.
- Listing images come from arbitrary scraped hosts — use `<img>`, not `next/image` (rule disabled in eslint config). Landlord photos go to the `listing-images` Storage bucket, never base64 in the row.
- DB schema changes go in `db/migrations/supabase_migration_phaseN_*.sql` and must be applied manually in the Supabase SQL editor.
