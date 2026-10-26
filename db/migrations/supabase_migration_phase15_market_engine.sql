-- Phase 15: market engine in Postgres, listing freshness, rent history,
-- crowdsourced "actually paid" rents, alert unsubscribe, listing images.
-- Safe to re-run. Apply in the Supabase SQL editor, then phase 16.

-- ─── 1. Listing freshness ────────────────────────────────────────────────
alter table public.properties
    add column if not exists last_seen_at timestamptz,
    add column if not exists is_active boolean not null default true;

update public.properties
set last_seen_at = coalesce(scraped_at, created_at, now())
where last_seen_at is null;

create index if not exists properties_active_market_idx
    on public.properties (area_id, property_type)
    where is_active;

create index if not exists properties_active_created_idx
    on public.properties (created_at desc)
    where is_active;

-- Scraped rows not seen by any scraper for 14 days are probably rented out.
-- Platform (landlord-posted) listings are never auto-expired.
create or replace function public.deactivate_stale_listings()
returns integer
language sql
security definer
set search_path = public
as $$
    with upd as (
        update public.properties
        set is_active = false
        where is_active
          and source = 'scraped'
          and last_seen_at < now() - interval '14 days'
        returning 1
    )
    select count(*)::int from upd;
$$;

revoke execute on function public.deactivate_stale_listings() from public, anon, authenticated;

-- Zero-fake-data: scraped owner phone numbers are personal data we never
-- verified. Stop keeping them; the listing links out to its source instead.
update public.properties
set contact_phone = null
where source = 'scraped' and contact_phone is not null;

-- ─── 2. Market stats (replaces fetching every row into the app) ──────────
create or replace view public.market_stats
with (security_invoker = true) as
select
    area_id,
    property_type,
    round(percentile_cont(0.5)  within group (order by rent))::int as median,
    round(percentile_cont(0.25) within group (order by rent))::int as p25,
    round(percentile_cont(0.75) within group (order by rent))::int as p75,
    count(*)::int as count
from public.properties
where is_active
  and rent > 0
  and area_id is not null
  and property_type is not null
group by area_id, property_type
having count(*) >= 3;

-- Totals for social proof without downloading rows.
create or replace view public.market_totals
with (security_invoker = true) as
select
    count(*)::int as active_listings,
    count(distinct area_id)::int as areas
from public.properties
where is_active;

-- ─── 3. Community report counts (replaces fetching every report) ─────────
create or replace view public.listing_report_counts
with (security_invoker = true) as
select property_id, count(*)::int as reports
from public.listing_reports
group by property_id;

-- ─── 4. Rent history (proprietary dataset, one row per day per market) ───
create table if not exists public.area_rent_history (
    snapshot_date date not null,
    area_id bigint not null references public.areas (area_id) on delete cascade,
    property_type text not null,
    median integer not null,
    p25 integer,
    p75 integer,
    count integer not null,
    primary key (snapshot_date, area_id, property_type)
);

alter table public.area_rent_history enable row level security;
drop policy if exists "rent history readable" on public.area_rent_history;
create policy "rent history readable"
    on public.area_rent_history for select
    to anon, authenticated
    using (true);

create or replace function public.snapshot_area_rent_history()
returns integer
language sql
security definer
set search_path = public
as $$
    with ins as (
        insert into public.area_rent_history
            (snapshot_date, area_id, property_type, median, p25, p75, count)
        select (now() at time zone 'Asia/Kolkata')::date,
               area_id, property_type, median, p25, p75, count
        from public.market_stats
        on conflict (snapshot_date, area_id, property_type) do update
            set median = excluded.median,
                p25 = excluded.p25,
                p75 = excluded.p75,
                count = excluded.count
        returning 1
    )
    select count(*)::int from ins;
$$;

revoke execute on function public.snapshot_area_rent_history() from public, anon, authenticated;

-- Seed today so charts have a first point.
select public.snapshot_area_rent_history();

-- ─── 5. Crowdsourced "what do you actually pay" ──────────────────────────
create table if not exists public.rent_submissions (
    id bigint generated always as identity primary key,
    area_id bigint not null references public.areas (area_id) on delete cascade,
    property_type text not null check (property_type in ('1RK', '1BHK', '2BHK', '3BHK', '4BHK')),
    rent integer not null check (rent between 2000 and 1000000),
    deposit integer check (deposit is null or deposit between 0 and 10000000),
    furnishing_status text check (furnishing_status is null or furnishing_status in ('Furnished', 'Semi-Furnished', 'Unfurnished')),
    submitter_session text,
    created_at timestamptz not null default now()
);

create unique index if not exists rent_submissions_dedup
    on public.rent_submissions (submitter_session, area_id, property_type)
    where submitter_session is not null;

alter table public.rent_submissions enable row level security;
drop policy if exists "rent submissions insert for all" on public.rent_submissions;
create policy "rent submissions insert for all"
    on public.rent_submissions for insert
    to anon, authenticated
    with check (true);

-- Only aggregates are public, and only with >= 3 submissions (k-anonymity).
create or replace view public.paid_rent_stats as
select
    area_id,
    property_type,
    round(percentile_cont(0.5) within group (order by rent))::int as median,
    round(avg(deposit::numeric / nullif(rent, 0)), 1) as deposit_months,
    count(*)::int as count
from public.rent_submissions
group by area_id, property_type
having count(*) >= 3;

grant select on public.paid_rent_stats to anon, authenticated;

-- ─── 6. Area watches: real dedupe + unsubscribe + alert bookkeeping ──────
alter table public.area_watches
    add column if not exists unsubscribe_token uuid not null default gen_random_uuid(),
    add column if not exists last_notified_at timestamptz,
    add column if not exists active boolean not null default true;

alter table public.area_watches
    drop constraint if exists area_watches_email_area_id_property_type_key;

create unique index if not exists area_watches_unique_watch
    on public.area_watches (email, area_id, coalesce(property_type, ''));

create unique index if not exists area_watches_unsub_token
    on public.area_watches (unsubscribe_token);

create or replace function public.unsubscribe_watch(token uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    with upd as (
        update public.area_watches set active = false
        where unsubscribe_token = token and active
        returning 1
    )
    select exists (select 1 from upd);
$$;

revoke execute on function public.unsubscribe_watch(uuid) from public;
grant execute on function public.unsubscribe_watch(uuid) to anon, authenticated;

-- ─── 7. Storage: listing photos (replaces base64 in the properties row) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "listing images public read" on storage.objects;
create policy "listing images public read"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'listing-images');

-- Landlords upload only into a folder named after their user id.
drop policy if exists "landlords upload own listing images" on storage.objects;
create policy "landlords upload own listing images"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'listing-images'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "landlords delete own listing images" on storage.objects;
create policy "landlords delete own listing images"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'listing-images'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- ─── 8. KYC documents: tenants upload into their own folder; the landlord
--        of the property they applied to can read (via signed URL) ────────
drop policy if exists "Authenticated users can upload KYC" on storage.objects;
drop policy if exists "tenants upload own kyc" on storage.objects;
create policy "tenants upload own kyc"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'kyc_documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "landlords read applicant kyc" on storage.objects;
create policy "landlords read applicant kyc"
    on storage.objects for select
    to authenticated
    using (
        bucket_id = 'kyc_documents'
        and exists (
            select 1
            from public.applications a
            join public.properties p on p.property_id = a.property_id
            where a.kyc_document_url = storage.objects.name
              and p.landlord_id = auth.uid()
        )
    );

-- ─── 9. Reviews: only tenants who applied to a listing may review it ─────
drop policy if exists "Tenants can insert reviews" on public.reviews;
create policy "Tenants can insert reviews" on public.reviews
    for insert to authenticated
    with check (
        auth.uid() = tenant_id
        and exists (
            select 1 from public.applications a
            where a.property_id = reviews.property_id and a.tenant_id = auth.uid()
        )
    );
