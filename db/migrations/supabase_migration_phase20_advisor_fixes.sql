-- Phase 20: fixes from the Supabase security / performance advisors.
-- Safe to re-run.

-- 1. analytics_daily_summary was a SECURITY DEFINER view readable with the
--    public anon key, so anyone could read daily traffic counts via
--    /rest/v1/analytics_daily_summary. Nothing in the app reads it; it is for
--    the owner in the SQL editor (which runs as postgres and is unaffected).
alter view public.analytics_daily_summary set (security_invoker = on);
revoke all on public.analytics_daily_summary from anon, authenticated;

-- (paid_rent_stats stays SECURITY DEFINER on purpose: it publishes only
--  k >= 3 aggregates of rent_submissions, which clients cannot read directly.
--  unsubscribe_watch(token) is callable by anon on purpose: the token is the
--  credential for one-click unsubscribe links.)

-- 2. Evaluate auth.uid() once per statement instead of once per row.
drop policy if exists "Tenants can insert reviews" on public.reviews;
create policy "Tenants can insert reviews" on public.reviews
    for insert to authenticated
    with check (
        (select auth.uid()) = tenant_id
        and exists (
            select 1 from public.applications a
            where a.property_id = reviews.property_id
              and a.tenant_id = (select auth.uid())
        )
    );

-- 3. Covering indexes for foreign keys (joins and cascading deletes).
create index if not exists analytics_events_user_idx on public.analytics_events (user_id);
create index if not exists area_rent_history_area_idx on public.area_rent_history (area_id);
create index if not exists messages_property_idx on public.messages (property_id);
create index if not exists rent_submissions_area_idx on public.rent_submissions (area_id);
