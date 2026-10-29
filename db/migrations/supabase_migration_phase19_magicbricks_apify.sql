-- Phase 19: MagicBricks via Apify, once a day.
-- MagicBricks blocks cloud IPs (HTTP 403), so the old direct scraper ran six
-- times a day and never got a listing. sync-magicbricks now calls the Apify
-- actor thirdwatch/magicbricks-scraper (~$0.003 per listing, 60 per run).
-- Needs the APIFY_API_TOKEN Edge Function secret (already set for NoBroker).
-- Safe to re-run.

select cron.unschedule(jobname) from cron.job
where jobname in ('sync-magicbricks-am', 'sync-magicbricks-pm', 'sync-magicbricks');

-- 06:15 IST = 00:45 UTC, after the morning NoBroker sync.
select cron.schedule('sync-magicbricks', '45 0 * * *', $$ select public.invoke_edge_function('sync-magicbricks') $$);
