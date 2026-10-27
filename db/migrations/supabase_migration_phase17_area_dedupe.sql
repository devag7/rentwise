-- Phase 17: merge duplicate / junk areas and prevent new duplicates.
-- The areas table had the same locality many times ("HSR Layout", "Hsr Layout",
-- "HSR layout", ...) plus street addresses saved as areas by older scrapers.
-- That split listings across duplicates and weakened every median.
-- Run once in the SQL editor. Safe to re-run.

begin;

create temp table area_map on commit drop as
with n as (
    select area_id, name, lower(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g')) k from public.areas
), keep as (
    select k, min(area_id) keep_id from n group by k
)
select n.area_id as old_id, keep.keep_id as new_id
from n join keep using (k)
where n.area_id <> keep.keep_id;

-- Address-like junk areas ("707, 9th Cross Rd, ..., Indiranagar, ...") -> the
-- curated locality (ids 1-50 from phase 8) whose name they contain.
insert into area_map (old_id, new_id)
select j.area_id, (
    select c.area_id from public.areas c
    where c.area_id <= 50
      and position(lower(regexp_replace(c.name, '[^a-zA-Z0-9]', '', 'g'))
                   in lower(regexp_replace(j.name, '[^a-zA-Z0-9]', '', 'g'))) > 0
    order by length(c.name) desc
    limit 1)
from public.areas j
where (j.name ~ '[0-9]' or j.name like '%,%')
  and j.area_id not in (select old_id from area_map)
  and exists (
      select 1 from public.areas c
      where c.area_id <= 50
        and position(lower(regexp_replace(c.name, '[^a-zA-Z0-9]', '', 'g'))
                     in lower(regexp_replace(j.name, '[^a-zA-Z0-9]', '', 'g'))) > 0);

update public.properties p set area_id = m.new_id from area_map m where p.area_id = m.old_id;
update public.area_watches w set area_id = m.new_id from area_map m where w.area_id = m.old_id;
update public.rent_submissions r set area_id = m.new_id from area_map m where r.area_id = m.old_id;
delete from public.area_rent_history h using area_map m where h.area_id = m.old_id;
delete from public.areas a using area_map m where a.area_id = m.old_id;

-- One row per locality from now on (case/space/punctuation-insensitive).
create unique index if not exists areas_name_key_uniq
    on public.areas (lower(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g')));

-- Re-snapshot today's medians on the merged areas.
delete from public.area_rent_history
where snapshot_date = (now() at time zone 'Asia/Kolkata')::date;
select public.snapshot_area_rent_history();

commit;

-- Check: remaining areas and the markets with enough comps
select (select count(*) from public.areas) as areas_left,
       (select count(*) from public.market_stats) as markets;
