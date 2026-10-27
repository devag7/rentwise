-- Phase 18: listings filed under the city ("Bangalore") instead of a locality.
-- NoBroker sometimes reports locality = "bangalore"; the real area is in the
-- listing title ("2 BHK Flat for Rent In Hongasandra"). Re-file those rows,
-- creating the locality if new, and leave unplaceable ones out of the medians.

-- 1. Create any missing localities named in the titles.
insert into public.areas (name)
select distinct initcap(trim(substring(p.address from '(?i)for\s+rent\s+in\s+(.+)$')))
from public.properties p
join public.areas a using (area_id)
where lower(a.name) in ('bangalore', 'bengaluru')
  and substring(p.address from '(?i)for\s+rent\s+in\s+(.+)$') is not null
  and lower(trim(substring(p.address from '(?i)for\s+rent\s+in\s+(.+)$'))) not in ('bangalore', 'bengaluru')
on conflict do nothing;

-- 2. Re-file each listing under the locality from its title.
update public.properties p
set area_id = t.area_id
from public.areas city, public.areas t
where p.area_id = city.area_id
  and lower(city.name) in ('bangalore', 'bengaluru')
  and lower(regexp_replace(t.name, '[^a-zA-Z0-9]', '', 'g'))
      = lower(regexp_replace(trim(substring(p.address from '(?i)for\s+rent\s+in\s+(.+)$')), '[^a-zA-Z0-9]', '', 'g'));

-- 3. Anything still under the city can't be placed in a market.
update public.properties p
set is_active = false
from public.areas city
where p.area_id = city.area_id and lower(city.name) in ('bangalore', 'bengaluru');

-- 4. Refresh today's rent history.
delete from public.area_rent_history where snapshot_date = (now() at time zone 'Asia/Kolkata')::date;
select public.snapshot_area_rent_history();
