# Supabase Edge Functions

The data pipeline (scrapers + alert emails) runs here, scheduled by pg_cron
(`db/migrations/supabase_migration_phase16_schedules.sql`). `scripts/` keeps the
old Docker cron as a fallback.

| Function | Called by | Auth | What it does |
|---|---|---|---|
| `sync-nobroker` | pg_cron 06:00 / 18:00 IST | service role | Apify `thirdwatch~nobroker-scraper` → `properties` |
| `sync-magicbricks` | pg_cron 06:15 IST | service role | Apify `thirdwatch~magicbricks-scraper` → `properties` (60 listings/run, 4 of 16 localities per day) |
| `send-alerts` | pg_cron 09:00 IST | service role | One Resend email per watcher address with new matching listings |
| `check-rent` | browser (`supabase.functions.invoke`) | none (`verify_jwt = false`) | "Is this rent fair?" verdict from `market_stats` |

## Deploy

```bash
supabase login
supabase link --project-ref <ref>
supabase secrets set APIFY_API_TOKEN=... RESEND_API_KEY=... \
  ALERT_FROM_EMAIL="RentWise <alerts@devshipit.com>" \
  SITE_URL=https://rentwise.devshipit.com
# optional: LLM fallback for parsing free text in check-rent
supabase secrets set ANTHROPIC_API_KEY=...
supabase functions deploy sync-nobroker sync-magicbricks send-alerts check-rent
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

Then in the Supabase SQL editor:

1. Run `db/migrations/supabase_migration_phase15_market_engine.sql`.
2. Database → Extensions: enable `pg_cron` and `pg_net`.
3. Fill in the project URL + service role key placeholders in
   `db/migrations/supabase_migration_phase16_schedules.sql` and run it.
4. Run `db/migrations/supabase_migration_phase19_magicbricks_apify.sql`
   (MagicBricks once a day via Apify).

## Manual runs

```bash
curl -X POST https://<ref>.supabase.co/functions/v1/sync-magicbricks \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
  -d '{"slot": 0}'         # slot 0-3 (4 localities each); omit body for today's slot
```

The three pipeline functions reject any JWT whose role isn't `service_role`
(the public anon key is also a valid JWT, so `verify_jwt` alone isn't enough).

Type-check locally: `deno check supabase/functions/*/index.ts`.
