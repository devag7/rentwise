# RentWise — know what a Bangalore flat is worth

**Live:** https://rentwise.devshipit.com · **Open data:** [/data](https://rentwise.devshipit.com/data) (CC BY 4.0)

RentWise prices every Bangalore rental listing against the **median of real comparable listings** in the same area and BHK, and tells you if it's under, at, or over market — with the number of comps behind the verdict. No estimates, no invented data: fewer than 3 comps means no verdict.

- **Is my rent fair?** — paste a NoBroker / MagicBricks / 99acres link or type `2BHK HSR 42k` at [/check](https://rentwise.devshipit.com/check). You get the median, the typical range, cheaper flats nearby, and a negotiation message to send.
- **Bangalore Rent Index** — median rent by area × BHK, refreshed twice daily, plus what tenants report *actually paying* (anonymous, shown only with 3+ reports).
- **Area rent pages** — `/bangalore/rent/hsr-layout/2bhk` with trend history.
- **Area alerts** — watch an area by email, no account needed.
- **Owner listings** — landlords list free; tenants apply, message, schedule tours.

## Stack

| Layer | What |
|---|---|
| Web | Next.js 16 (App Router, ISR) on **Vercel** (`bom1`) |
| Database | **Supabase Postgres** — market stats computed in SQL views (`market_stats`, `paid_rent_stats`), daily `area_rent_history` |
| Auth | **Supabase Auth** (tenant / landlord roles) |
| Storage | **Supabase Storage** — `listing-images` (public), `kyc_documents` (private, signed URLs) |
| Jobs | **Supabase Edge Functions** (`sync-nobroker`, `sync-magicbricks`, `send-alerts`, `check-rent`) scheduled by **pg_cron** |
| Email | Resend (alert digests with one-click unsubscribe) |
| Maps | Mapbox (map view, real commute times) |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key (Mapbox optional)
npm run dev
```

Database: apply `db/migrations/*.sql` in order in the Supabase SQL editor. Edge Functions: see [`supabase/README.md`](supabase/README.md).

```bash
npm run lint && npm run typecheck && npm run build
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

## Data policy

Scraped listings store facts only (rent, BHK, area, size, deposit, date, link to source). Owner names and phone numbers are not stored. Listings unseen for 14 days are marked inactive and drop out of the medians. Anyone can flag a listing; 3 flags hide it.

## License

Code: MIT. Rent index data: CC BY 4.0 — credit "RentWise".
