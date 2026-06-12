-- Phase 13: deposit data + frictionless area watch capture
-- (inspired by bengaluru.rent's zero-friction email capture)

-- 1. Deposit column — the NoBroker actor supplies deposit_inr; landlord
--    form collects it too. Nullable: zero-fake-data, gaps stay visible.
alter table public.properties
    add column if not exists deposit integer;

-- 2. Area watches — email capture WITHOUT requiring an account.
--    "Watch this area" → daily alert emails once SMTP lands (Phase 2).
create table if not exists public.area_watches (
    id bigint generated always as identity primary key,
    email text not null,
    area_id bigint references public.areas (area_id) on delete cascade,
    max_rent integer,
    property_type text,
    created_at timestamptz not null default now(),
    -- one watch per email per area+type
    unique (email, area_id, property_type)
);

create index if not exists area_watches_area_idx on public.area_watches (area_id);

alter table public.area_watches enable row level security;

-- Insert-only for everyone (anon + authenticated); nobody reads back
-- through the public API. Service role handles matching/emails.
drop policy if exists "area watches insert for all" on public.area_watches;
create policy "area watches insert for all"
    on public.area_watches
    for insert
    to anon, authenticated
    with check (
        email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
        and char_length(email) <= 254
    );
