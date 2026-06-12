-- Phase 12: Tighten properties RLS
-- Found during prod review: the anon role can INSERT into public.properties
-- (verified with a live 201). Anyone with the public anon key could spam
-- fake listings. Inserts should come only from:
--   * the service role (scraper pipeline) — bypasses RLS anyway
--   * authenticated landlords creating their own listings
--
-- Run AFTER the next scraper sync completes (the seeding path currently
-- relies on service-role/anon inserts; after this migration the scraper
-- must run with the service role key only — which is how the droplet
-- container is configured).

-- Remove the test row created during the RLS probe
delete from public.properties where address = '__rls_test__';

-- Drop any permissive insert policies on properties for anon
do $$
declare
    pol record;
begin
    for pol in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = 'properties'
          and cmd = 'INSERT'
    loop
        execute format('drop policy if exists %I on public.properties', pol.policyname);
    end loop;
end $$;

-- Recreate a single explicit insert policy: authenticated landlords only,
-- and only for rows they own.
create policy "landlords insert own listings"
    on public.properties
    for insert
    to authenticated
    with check (landlord_id = auth.uid());

-- (Service role bypasses RLS; the scraper keeps working unchanged.)
