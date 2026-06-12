-- Phase 11: Product analytics events
-- Lightweight first-party event tracking for user-growth metrics
-- (page views, signups, logins, applications) — pre-seed traction data.

create table if not exists public.analytics_events (
    id bigint generated always as identity primary key,
    event_name text not null,
    user_id uuid references auth.users (id) on delete set null,
    session_id text,
    path text,
    properties jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_time_idx
    on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_time_idx
    on public.analytics_events (created_at desc);

alter table public.analytics_events enable row level security;

-- Anyone (anon or authenticated) may write events; nobody but the
-- service role may read them back.
drop policy if exists "analytics insert for all" on public.analytics_events;
create policy "analytics insert for all"
    on public.analytics_events
    for insert
    to anon, authenticated
    with check (true);

-- Convenience view for quick dashboards (service-role only via RLS).
create or replace view public.analytics_daily_summary as
select
    date_trunc('day', created_at) as day,
    event_name,
    count(*) as events,
    count(distinct coalesce(user_id::text, session_id)) as uniques
from public.analytics_events
group by 1, 2
order by 1 desc, 3 desc;
