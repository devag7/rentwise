-- Phase 16: schedule the data pipeline inside Supabase (pg_cron + pg_net).
-- Replaces the cron process that ran in the droplet's Docker container.
--
-- Before running:
--   1. Deploy the Edge Functions (see supabase/README.md) and set the
--      CRON_SECRET Edge Function secret (any random string, 32+ chars).
--   2. Replace YOUR-CRON-SECRET below with that same value, run once.
-- The service role key never leaves Supabase: functions authenticate the
-- scheduler with the x-cron-secret header.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://mcbrjtujlxiihuxcgsph.supabase.co', 'project_url')
where not exists (select 1 from vault.secrets where name = 'project_url');

select vault.create_secret('YOUR-CRON-SECRET', 'cron_secret')
where not exists (select 1 from vault.secrets where name = 'cron_secret');

create or replace function public.invoke_edge_function(fn text, body jsonb default '{}'::jsonb)
returns bigint
language sql
security definer
set search_path = public
as $$
    select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/' || fn,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
        ),
        body := body,
        timeout_milliseconds := 150000
    );
$$;

revoke execute on function public.invoke_edge_function(text, jsonb) from public, anon, authenticated;

-- Unschedule old versions so this file is re-runnable.
select cron.unschedule(jobname) from cron.job
where jobname in ('sync-nobroker', 'sync-magicbricks-am', 'sync-magicbricks-pm',
                  'deactivate-stale', 'snapshot-history', 'send-alerts');

-- 06:00 and 18:00 IST = 00:30 and 12:30 UTC
select cron.schedule('sync-nobroker',       '30 0,12 * * *', $$ select public.invoke_edge_function('sync-nobroker') $$);
-- MagicBricks runs in batches (Edge Function wall-clock limit); 3 batches each run.
select cron.schedule('sync-magicbricks-am', '35,45,55 0 * * *', $$ select public.invoke_edge_function('sync-magicbricks') $$);
select cron.schedule('sync-magicbricks-pm', '35,45,55 12 * * *', $$ select public.invoke_edge_function('sync-magicbricks') $$);
-- Housekeeping after the evening sync, then history snapshot, then alerts at 09:00 IST.
select cron.schedule('deactivate-stale',    '0 14 * * *',     $$ select public.deactivate_stale_listings() $$);
select cron.schedule('snapshot-history',    '10 14 * * *',    $$ select public.snapshot_area_rent_history() $$);
select cron.schedule('send-alerts',         '30 3 * * *',     $$ select public.invoke_edge_function('send-alerts') $$);
