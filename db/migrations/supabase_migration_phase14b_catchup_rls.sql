-- Phase 14b: catch-up for the production project (mcbrjtujlxiihuxcgsph).
-- Audit (Oct 2026) found phases 7, 9, 10 and 14 never applied there:
--   * RLS DISABLED on properties / areas / favorites — anyone with the
--     public anon key could edit or delete any row (policies existed but
--     were not enforced)
--   * applications / messages / tours / reviews / listing_reports tables
--     and the kyc_documents bucket missing (those UI features 404'd)
--   * properties.size / property_type NOT NULL and fake column defaults
--     (bathrooms=1, parking=false, 'Unfurnished') forced invented values
-- Idempotent: safe on databases that already have some of this.

-- ─── 1. properties: real-data-friendly columns ───────────────────────────
alter table public.properties
    add column if not exists latitude double precision,
    add column if not exists longitude double precision,
    add column if not exists deposit integer;

alter table public.properties alter column size drop not null;
alter table public.properties alter column property_type drop not null;
-- Zero-fake-data: unknown stays NULL instead of a made-up default.
alter table public.properties alter column bathrooms drop default;
alter table public.properties alter column parking drop default;
alter table public.properties alter column furnishing_status drop default;

create unique index if not exists idx_properties_external_id
    on public.properties (external_id) where external_id is not null;
create index if not exists idx_properties_coordinates
    on public.properties (latitude, longitude)
    where latitude is not null and longitude is not null;
create index if not exists properties_landlord_idx on public.properties (landlord_id);

-- ─── 2. RLS on the core tables ───────────────────────────────────────────
alter table public.areas enable row level security;
drop policy if exists "areas readable" on public.areas;
create policy "areas readable" on public.areas
    for select to anon, authenticated using (true);
-- (inserts come from the service role scrapers only)

alter table public.properties enable row level security;
drop policy if exists "Anyone can view properties" on public.properties;
create policy "Anyone can view properties" on public.properties
    for select to anon, authenticated using (true);
drop policy if exists "landlords insert own listings" on public.properties;
create policy "landlords insert own listings" on public.properties
    for insert to authenticated with check ((select auth.uid()) = landlord_id);
drop policy if exists "Landlords can update own properties" on public.properties;
create policy "Landlords can update own properties" on public.properties
    for update to authenticated
    using ((select auth.uid()) = landlord_id)
    with check ((select auth.uid()) = landlord_id);
drop policy if exists "Landlords can delete own properties" on public.properties;
create policy "Landlords can delete own properties" on public.properties
    for delete to authenticated using ((select auth.uid()) = landlord_id);

alter table public.favorites enable row level security;
drop policy if exists "Users can manage their own favorites" on public.favorites;
drop policy if exists "Users can insert their own favorites" on public.favorites;
drop policy if exists "favorites select own" on public.favorites;
create policy "favorites select own" on public.favorites
    for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "favorites insert own" on public.favorites;
create policy "favorites insert own" on public.favorites
    for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "favorites delete own" on public.favorites;
create policy "favorites delete own" on public.favorites
    for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists favorites_property_idx on public.favorites (property_id);

-- ─── 3. Applications, messages, tours, reviews (phase 7, hardened) ───────
create table if not exists public.applications (
    application_id serial primary key,
    property_id int references public.properties (property_id) on delete cascade,
    tenant_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    intent_description text check (char_length(intent_description) <= 2000),
    move_in_date date,
    kyc_document_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index if not exists applications_property_idx on public.applications (property_id);
create index if not exists applications_tenant_idx on public.applications (tenant_id);
alter table public.applications enable row level security;

drop policy if exists "Tenants can insert applications" on public.applications;
create policy "Tenants can insert applications" on public.applications
    for insert to authenticated with check ((select auth.uid()) = tenant_id and status = 'pending');
drop policy if exists "Tenants can view own applications" on public.applications;
create policy "Tenants can view own applications" on public.applications
    for select to authenticated using ((select auth.uid()) = tenant_id);
drop policy if exists "Landlords can view apps for their properties" on public.applications;
create policy "Landlords can view apps for their properties" on public.applications
    for select to authenticated using (
        exists (select 1 from public.properties p
                where p.property_id = applications.property_id and p.landlord_id = (select auth.uid()))
    );
drop policy if exists "Landlords can update apps for their properties" on public.applications;
create policy "Landlords can update apps for their properties" on public.applications
    for update to authenticated
    using (exists (select 1 from public.properties p
                   where p.property_id = applications.property_id and p.landlord_id = (select auth.uid())))
    with check (exists (select 1 from public.properties p
                        where p.property_id = applications.property_id and p.landlord_id = (select auth.uid())));

create table if not exists public.messages (
    message_id serial primary key,
    property_id int references public.properties (property_id) on delete cascade,
    sender_id uuid not null references auth.users (id) on delete cascade,
    receiver_id uuid not null references auth.users (id) on delete cascade,
    content text not null check (char_length(content) between 1 and 4000),
    read_status boolean default false,
    created_at timestamptz default now()
);
create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists messages_receiver_idx on public.messages (receiver_id);
alter table public.messages enable row level security;
drop policy if exists "Users can insert messages" on public.messages;
create policy "Users can insert messages" on public.messages
    for insert to authenticated with check ((select auth.uid()) = sender_id);
drop policy if exists "Users can view messages" on public.messages;
create policy "Users can view messages" on public.messages
    for select to authenticated using ((select auth.uid()) in (sender_id, receiver_id));
drop policy if exists "Receivers can mark read" on public.messages;
create policy "Receivers can mark read" on public.messages
    for update to authenticated
    using ((select auth.uid()) = receiver_id)
    with check ((select auth.uid()) = receiver_id);

create table if not exists public.tours (
    tour_id serial primary key,
    property_id int references public.properties (property_id) on delete cascade,
    tenant_id uuid not null references auth.users (id) on delete cascade,
    requested_date timestamptz not null,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
    notes text check (char_length(notes) <= 1000),
    created_at timestamptz default now()
);
create index if not exists tours_property_idx on public.tours (property_id);
create index if not exists tours_tenant_idx on public.tours (tenant_id);
alter table public.tours enable row level security;
drop policy if exists "Tenants can request tours" on public.tours;
create policy "Tenants can request tours" on public.tours
    for insert to authenticated with check ((select auth.uid()) = tenant_id and status = 'pending');
drop policy if exists "Tenants can view own tours" on public.tours;
create policy "Tenants can view own tours" on public.tours
    for select to authenticated using ((select auth.uid()) = tenant_id);
drop policy if exists "Landlords can view tours for their properties" on public.tours;
create policy "Landlords can view tours for their properties" on public.tours
    for select to authenticated using (
        exists (select 1 from public.properties p
                where p.property_id = tours.property_id and p.landlord_id = (select auth.uid()))
    );
drop policy if exists "Landlords can update tours for their properties" on public.tours;
create policy "Landlords can update tours for their properties" on public.tours
    for update to authenticated
    using (exists (select 1 from public.properties p
                   where p.property_id = tours.property_id and p.landlord_id = (select auth.uid())))
    with check (exists (select 1 from public.properties p
                        where p.property_id = tours.property_id and p.landlord_id = (select auth.uid())));

create table if not exists public.reviews (
    review_id serial primary key,
    property_id int references public.properties (property_id) on delete cascade,
    tenant_id uuid not null references auth.users (id) on delete cascade,
    rating int not null check (rating between 1 and 5),
    review_text text check (char_length(review_text) <= 1000),
    created_at timestamptz default now(),
    unique (property_id, tenant_id)
);
create index if not exists reviews_tenant_idx on public.reviews (tenant_id);
alter table public.reviews enable row level security;
drop policy if exists "Anyone can view reviews" on public.reviews;
create policy "Anyone can view reviews" on public.reviews
    for select to anon, authenticated using (true);
-- insert policy (applicants only) is created in phase 15

-- ─── 4. Community listing reports (phase 14) ─────────────────────────────
create table if not exists public.listing_reports (
    id bigint generated always as identity primary key,
    property_id int not null references public.properties (property_id) on delete cascade,
    reason text not null check (reason in ('fake', 'rented_out', 'wrong_price', 'spam', 'other')),
    detail text check (char_length(detail) <= 500),
    reporter_session text,
    created_at timestamptz not null default now()
);
create index if not exists listing_reports_property_idx on public.listing_reports (property_id);
create unique index if not exists listing_reports_dedup
    on public.listing_reports (property_id, reporter_session) where reporter_session is not null;
alter table public.listing_reports enable row level security;
drop policy if exists "reports insert for all" on public.listing_reports;
create policy "reports insert for all" on public.listing_reports
    for insert to anon, authenticated with check (reporter_session is not null);
-- Counts must be readable (heavily-reported listings are hidden), but the
-- free-text detail and reporter session must not be: column-level grant.
drop policy if exists "reports readable" on public.listing_reports;
create policy "reports readable" on public.listing_reports
    for select to anon, authenticated using (true);
revoke select on public.listing_reports from anon, authenticated;
grant select (property_id) on public.listing_reports to anon, authenticated;

-- ─── 5. Private KYC bucket (policies in phase 15) ────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc_documents', 'kyc_documents', false, 2097152, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set public = false;

-- Tenants can read their own uploads (folder = their user id).
drop policy if exists "Users can only view their own KYC documents" on storage.objects;
drop policy if exists "Users can view own KYC or Landlords can view" on storage.objects;
drop policy if exists "tenants read own kyc" on storage.objects;
create policy "tenants read own kyc" on storage.objects
    for select to authenticated
    using (bucket_id = 'kyc_documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
