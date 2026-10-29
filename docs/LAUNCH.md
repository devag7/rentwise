# Launch kit

Drafts for launch day. **Numbers are a snapshot from 29 Oct 2026** (431 active
listings, medians from `market_stats`). Re-pull them on the day from
https://rentwise.devshipit.com/insights or the SQL at the bottom; only quote
markets with 10+ listings.

Rules for every post: asking rents only (not paid rents), say how many listings,
no claims the data can't back, link the open data.

---

## 1. Show HN

**Title** (≤ 80 chars):

> Show HN: RentWise – Bangalore rent medians from live listings, open data

**Text:**

> Renting in Bangalore usually means guessing whether ₹40k for a 2BHK is fair.
> Brokers quote whatever the market will bear and portals show listings, not prices.
>
> RentWise pulls live listings from NoBroker and MagicBricks every day (via Apify),
> files them under canonical localities, and computes median / IQR per area and BHK
> in a Postgres view. Paste a listing link or type "2BHK HSR 42k" and it tells you how
> that compares with comparable live listings — and refuses to give a verdict when
> there are fewer than 3 comps.
>
> Some things from today's data (431 active listings):
> - 2BHK median: ₹40,000 in Indiranagar vs ₹18,000 in Hebbal (20 and 23 listings)
> - 1BHK: ₹20,000 in Indiranagar, ₹12,000 in Electronic City (21 and 29)
> - Typical deposit on NoBroker listings: 4 months' rent
>
> Stack: Next.js 16 on Vercel (ISR pages per area/BHK), Supabase (Postgres views,
> RLS, pg_cron + Edge Functions for the scrapers and alert emails). No fake data:
> unknown fields stay empty, no default BHK or size, no scraped phone numbers.
>
> Aggregates are CC-BY at /data. Code is MIT: https://github.com/devag7/rentwise
>
> Limitations: asking rents, not paid rents (there's an anonymous "what do you pay"
> form to fix that over time); some areas have only a handful of listings.

---

## 2. r/bangalore

**Title:**

> I track live rental listings across Bangalore. Here's what a 2BHK actually costs by area (Oct 2026)

**Body:**

> Built a free tool that pulls live listings from NoBroker + MagicBricks and works
> out the median rent per area. No login, no brokers, no ads.
>
> **2BHK median asking rent (live listings, 29 Oct):**
>
> | Area | Median | Typical range | Listings |
> |---|---|---|---|
> | Indiranagar | ₹40,000 | ₹30,000–50,000 | 20 |
> | Marathahalli | ₹26,000 | ₹20,000–31,500 | 18 |
> | RT Nagar | ₹21,500 | ₹12,750–24,950 | 10 |
> | Electronic City | ₹19,000 | ₹16,000–23,000 | 24 |
> | Hebbal | ₹18,000 | ₹14,350–20,000 | 23 |
>
> **1BHK:** Indiranagar ₹20,000 · Marathahalli ₹17,000 · Electronic City ₹12,000 · Hebbal ₹10,000
>
> Typical deposit on these listings: **4 months' rent**.
>
> If you're negotiating, paste your listing link at rentwise.devshipit.com/check —
> it tells you how far above/below the area median it is and shows cheaper flats
> nearby. If an area has fewer than 3 listings it says so instead of guessing.
>
> These are *asking* rents. If you're renting now, you can anonymously add what you
> actually pay (rentwise.devshipit.com/insights) — that's the number nobody publishes.
>
> Raw aggregates are free to download (/data). Happy to add areas people ask for.

Post on a weekday evening IST. Reply to every comment the first two hours; add
requested localities to `BANGALORE_LOCALITIES` in both sync functions.

---

## 3. X thread

1. What does a 2BHK cost in Bangalore right now? I'm tracking live listings across the city. Medians, 29 Oct 👇
2. Indiranagar ₹40,000 · Marathahalli ₹26,000 · Electronic City ₹19,000 · Hebbal ₹18,000. Same flat size, 2.2× apart.
3. 1BHK: Indiranagar ₹20,000 vs Electronic City ₹12,000.
4. Typical deposit on these listings: 4 months' rent.
5. Got a listing? Paste the link → it tells you how it compares with live comps, and refuses to guess when there aren't enough. rentwise.devshipit.com/check
6. Open data (CC-BY) + MIT code: rentwise.devshipit.com/data · github.com/devag7/rentwise

Attach the area link cards (they preview with the real medians), e.g.
`https://rentwise.devshipit.com/bangalore/rent/indiranagar`.

---

## Monthly rent report

First week of each month: re-run the SQL, post the 2BHK table + the biggest movers
from `area_rent_history` (only once there are 30+ days of history) to r/bangalore
and X, and send it to the reporters who cover the Magicbricks/Anarock indices.

---

## SQL (Supabase SQL editor)

```sql
-- Medians per area/BHK with enough listings to quote
select a.name, m.property_type, m.median, m.p25, m.p75, m.count
from market_stats m join areas a using (area_id)
where m.count >= 10 and m.property_type in ('1BHK','2BHK','3BHK')
order by m.property_type, m.median desc;

-- Totals and typical deposit (months of rent)
select count(*) filter (where is_active) as active,
       percentile_cont(0.5) within group (order by deposit::numeric / nullif(rent, 0))
         filter (where is_active and deposit > 0) as deposit_months
from properties;
```
