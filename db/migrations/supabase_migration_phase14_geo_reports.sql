-- Phase 14: real listing coordinates + community reporting

-- 1. Real per-listing coordinates (the NoBroker actor supplies them;
--    landlord form can geocode later). Map pins stop being synthetic.
alter table public.properties
    add column if not exists latitude double precision,
    add column if not exists longitude double precision;

-- 2. Community reports — bengaluru.rent-style trust layer.
--    Anyone can flag a listing; listings with >= 3 reports get hidden
--    by the app's queries.
create table if not exists public.listing_reports (
    id bigint generated always as identity primary key,
    property_id bigint not null references public.properties (property_id) on delete cascade,
    reason text not null check (reason in ('fake', 'rented_out', 'wrong_price', 'spam', 'other')),
    detail text check (char_length(detail) <= 500),
    reporter_session text,
    created_at timestamptz not null default now()
);

create index if not exists listing_reports_property_idx on public.listing_reports (property_id);

alter table public.listing_reports enable row level security;

-- Insert-only for everyone; one report per session per property keeps
-- report-bombing expensive without requiring accounts.
drop policy if exists "reports insert for all" on public.listing_reports;
create policy "reports insert for all"
    on public.listing_reports
    for insert
    to anon, authenticated
    with check (true);

create unique index if not exists listing_reports_dedup
    on public.listing_reports (property_id, reporter_session)
    where reporter_session is not null;

-- Anyone may read report counts (needed to hide heavily-reported pins).
drop policy if exists "reports readable" on public.listing_reports;
create policy "reports readable"
    on public.listing_reports
    for select
    to anon, authenticated
    using (true);
