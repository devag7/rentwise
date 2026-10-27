# RentWise — Audit, Research & Implementation Plan

_October 2026. Companion to STRATEGY.md (positioning) and SCALE_PLAN.md (infra phases).
This plan supersedes SCALE_PLAN's ordering: trust fixes now come before growth work._

---

## 1. What I ran and what's broken

Ran locally: `npm ci`, lint, typecheck, production build, `next start`, the
Playwright smoke suite, and a desktop + mobile browser pass over every page.
The live droplet (`157.245.110.163:3009`) did not respond from the test sandbox
(that may be sandbox network policy, not an outage — check it from your own
machine).

### Fixed in this commit

| Bug | Effect | Fix |
|---|---|---|
| `src/utils/supabase/middleware.ts` used `NEXT_PUBLIC_SUPABASE_URL!` with no fallback | If the image is built without Supabase keys, **every route 500s, including `/api/health`**, so the deploy healthcheck can't even report it | Middleware now skips the session refresh when keys are missing |

### Still broken — P0 (these contradict the "zero fake data" promise)

The product's whole pitch is honesty ("KNOW what it's worth", zero invented data).
Several widgets still invent data. A single Reddit commenter spotting these
would sink the launch.

| Where | What's fake | Action |
|---|---|---|
| `components/property/PaymentModal.tsx` (used from tenant dashboard) | Asks for **card number + CVC**, then shows "Transaction Verified and Vaulted" after a 2.5s timer. No payment happens. Collecting card details on a fake form is a legal and trust risk. | Remove now. Re-add later with Razorpay only if a real payment flow is needed. |
| `components/property/PropertyReviews.tsx` | "Verified Tenant" reviews and a 3.8–4.9 star score generated from the property ID, shown on **every** listing | Remove, or show real rows from the `reviews` table with an empty state. Fake reviews also fall under India's CCPA rules on fake online reviews. |
| `components/property/CommuteAnalyzer.tsx` | Commute distance computed from `workplace.length + area.length` | Replace with Mapbox Directions API (token already exists) or remove |
| `components/property/NeighborhoodProfile.tsx` | Hardcoded walkability/safety scores ("Neural Neighborhood Profile") | Remove scores; keep only facts you can source |
| `utils/generateLease.ts` | Footer says "Generated via RentWise Smart Contracts" | Say "Draft agreement — not legally reviewed" |
| `app/page.tsx` copy | "guaranteed by our strict intake protocol", "elite network", "Proprietary Pricing Model 2.0", "Neural Match" | Replace with claims you can prove (number of listings, number of comps, update time) |
| `properties/[id]/page.tsx` | Falls back to a hardcoded ₹/sqft "AI prediction" when there are fewer than 3 comps | Show "Not enough comparables yet" instead of a made-up number |

### P1 — correctness and scale bugs

1. **Possible silent 1,000-row cap.** `properties/page.tsx`, `insights/page.tsx` and
   `utils/reports.ts` select all rows with no range. If the Supabase project keeps
   the default 1,000-row limit on API responses, medians are computed on a subset
   once the table grows. Fix: a Postgres view/RPC `market_stats(area_id, property_type, median, count)`
   using `percentile_cont(0.5)`, queried once (also much faster).
2. **Stale listings never expire.** Scraped rows are never deleted or marked
   inactive, so old rented-out flats keep counting toward medians. Fix: add
   `last_seen_at`, mark rows not seen for 14 days as inactive, and compute
   medians only on active rows.
3. **`/insights` is never cached.** It reads cookies through the server client,
   so `revalidate = 1800` has no effect. Use a cookie-less client (like `sitemap.ts` does).
4. **Duplicate area watches.** `unique (email, area_id, property_type)` doesn't
   dedupe when BHK is blank (Postgres NULLs are distinct). Use
   `coalesce(property_type,'')` in a unique index.
5. **Default BHK is invented.** Both scrapers default `property_type` to `2BHK`
   and `size` to 500 when unknown, which pollutes the 2BHK medians. Store NULL
   and exclude from comps.
6. **Production build depends on GitHub repo variables.** `NEXT_PUBLIC_*` values
   are baked in at build time in Actions; the droplet's `.env` cannot change
   them after. Confirm `vars.NEXT_PUBLIC_SUPABASE_URL` etc. are set.
7. `middleware.ts` → rename to `proxy.ts` (Next 16 deprecation warning).

### P1 — UX

- `/properties` has **no `<h1>`** (SEO) and login/register pages share one generic title.
- On mobile, around ten filter fields stack above the listings; users scroll a
  full screen before seeing a flat. Collapse filters behind a "Filters" button
  on mobile.
- The site lives on a bare IP over HTTP. This alone blocks SEO, sharing trust, and email.

---

## 2. Why it isn't on GitHub Trending

GitHub Trending ranks repos by **stars gained in a short window** (a day or a
week), not total stars. Repos get there from a coordinated launch spike
(Show HN plus X plus Reddit on the same day), and developers star things they can
**reuse or self-host**.

RentWise currently has none of that:
- No LICENSE, so it isn't legally open source and nobody can reuse it.
- The README has no screenshot or GIF, no live demo link (a bare IP), and no one-line pitch.
- It's a single-city product app, which developers don't star. They star tools,
  datasets and templates.
- There has never been a launch, so there was never a star spike.

**What would actually trend** (pick one, ship it as its own repo or a top-level folder):

1. **Open Bangalore Rent Dataset** (recommended). A daily GitHub Action that
   publishes aggregate medians (area × BHK × date: median, p25, p75, count) as
   CSV/Parquet under CC-BY, plus a static chart page. Aggregates only, no raw
   listings, no phone numbers, which also keeps legal risk low. It's
   press-friendly, fits Show HN, and every download links back to RentWise.
2. **"Rent index for your city" template.** One-command Docker deploy of the
   comps engine plus index page, with a pluggable data source. Self-hostable apps trend.
3. Avoid open-sourcing a NoBroker/MagicBricks scraper. It invites a
   cease-and-desist (see §6).

Launch checklist: MIT license on code, CC-BY on data, README with a GIF and
live link, a domain, a Show HN post on a Tuesday morning US Eastern time, and a
same-day r/bangalore data post plus an X thread. Answer every comment for 24 hours.

---

## 3. The AI layer ("Llama / AI assistant")

> Interpretation: "add laya or jev" read as "add an AI layer, e.g. Llama".
> If you meant a specific product, swap it in. The design is model-agnostic.

Only add AI where it **uses the real comps data**, never where it would invent
numbers.

| Feature | What it does | Model |
|---|---|---|
| **"Is this rent fair?" checker** (highest value) | User pastes a NoBroker/MagicBricks/99acres link or types "2BHK HSR ₹42k". The app parses it, looks up the real median and comp count, and returns a verdict plus a negotiation script ("comps say ₹38k; here are 3 cheaper listings nearby"). | A small model for parsing only; numbers come from SQL |
| **Listing fact extraction** | Pull deposit months, "bachelors allowed", veg-only, pets, gated society and maintenance from free-text descriptions. Store NULL if not stated. | Llama 3.x 8B (Groq/Ollama, cheap) or Claude Haiku |
| **Ask RentWise chat** on `/insights` | Natural-language questions over the index ("cheapest 1BHK within 5km of Manyata?"), using tool calls into the stats view | Claude or Llama with function calling |
| **WhatsApp bot** (phase 4) | Same fair-rent checker inside WhatsApp, where this audience already shares flats | WhatsApp Cloud API + the same backend |

Rules: the model never outputs a rent number that didn't come from the database;
always show the comp count; log every answer to `analytics_events`.

---

## 4. ICP and competitor research (summary)

**ICP:** 22–32-year-old tech workers moving to or within Bangalore (ORR,
Whitefield, Manyata, Koramangala, HSR), often flat-sharing. Bangalore had the
fastest rent growth in India in Q1 2026 (Magicbricks index).

**Their top pains:**
- Deposits of 6–12 months that are hard to get back
- Brokers inflating rent based on salary
- Fake or broker-posed "owner" listings
- Flatmate scams
- Steep yearly hikes

| Competitor | What users hate | RentWise's opening |
|---|---|---|
| NoBroker | Paid relationship-manager plans, refunds, numbers reaching brokers (about 1.7k complaints on consumercomplaints.in, 2.5★) | Independent price check that never sells your number |
| MagicBricks / 99acres / Housing | Stale listings, brokers posing as owners | Per-listing verdict plus community flags |
| **bengaluru.rent** (closest) | It's crowdsourced *actual* rents paid, anonymous, no login, map-first | RentWise has *asking* rents at scale. "Asking vs actually paid" per area is the strongest story nobody tells. Add a "what do you pay?" anonymous submission. |
| Flatmate groups (FB/WhatsApp/Telegram/X) | No verification, no price context | "Fair share per person" calculator plus scam signals, shared into those groups |
| Coliving (Stanza etc.) | Opaque per-bed pricing | "Coliving bed vs 2BHK split" comparison |

No India-focused AI rent tool was found. The space is wide open for the
fair-rent checker in §3.

---

## 5. Getting real, active users

North-star metric: weekly active searchers (WAS). Pre-seed bar: 1k WAS, 15% week-4 retention.

1. **Domain + HTTPS** (owner, one day). Nothing below works on a bare IP.
2. **Ride viral rent outrage.** Bangalore rent posts go viral on X and
   r/bangalore nearly every week and get picked up by Business Today, Deccan
   Herald and others. Reply with the data: "Median 2BHK in Indiranagar is ₹X
   across N listings; this one is 35% over." Reply with data, not ads.
3. **Monthly Bangalore Rent Report.** Auto-generated from the index, with one
   striking chart (e.g. "deposit months by area", "asking rent change by
   locality"). Pitch it to the reporters who cover the Magicbricks/Anarock
   indices. An independent, broker-free index is a press angle the portals can't claim.
4. **Programmatic SEO.** `/bangalore/rent/[area]` and `/[area]/[bhk]` pages
   (median, range, count, last updated, live listings, FAQ JSON-LD). That's 50
   areas × 3 configurations = 150 pages for "1bhk rent in hsr layout" searches.
5. **r/bangalore + r/developersIndia data posts.** "I analysed N rental
   listings; here's what 2BHKs actually cost by area." A data post, not a promo.
6. **WhatsApp loop.** A "Check this listing" share card from every verdict. The
   area-watch link gets dropped into society and flatmate groups.
7. **Retention.** Turn on area-watch alerts (the table already captures
   emails, but no email is sent yet). This is the main reason anyone comes back.

---

## 6. Legal note (not legal advice)

Scraping portals with terms that ban automated access carries contract and
IT-Act s.43 risk. Owner names and phones are personal data under the DPDP Act
2023. RentWise also labels competitors' listings "overpriced", which makes a
cease-and-desist plausible once traffic arrives.

Reduce the risk:
- Store facts only (rent, BHK, area, size, date).
- Link out instead of re-hosting photos.
- Stop storing `contact_name` and `contact_phone` from scrapes.
- Publish aggregates only in any open dataset.
- Grow crowdsourced and landlord-direct data so you depend less on scraping.

---

## 7. Implementation plan (sequenced; one PR per line)

### Week 0 — Owner (blocking)
- [ ] Buy a domain, put Cloudflare in front, set up HTTPS; set `NEXT_PUBLIC_SITE_URL`; set Supabase auth URL
- [ ] Confirm GitHub repo variables `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/MAPBOX_TOKEN` are set
- [ ] Pick an email sender (Resend free tier) and verify the domain
- [ ] Rotate the Apify token (flagged in SCALE_PLAN)

### Week 1 — Trust (P0)
- [ ] Remove the fake PaymentModal, the mock reviews, the fake commute numbers and the hardcoded neighbourhood scores; honest copy on the homepage and lease
- [ ] Replace the "AI prediction" fallback with "not enough comps"
- [ ] Stop defaulting unknown BHK to 2BHK and unknown size to 500; drop scraped phone numbers
- [ ] Add MIT LICENSE; rewrite README (pitch, GIF, live link, self-host quickstart)

_Done when:_ `grep -rn "mock\|Math.random\|setTimeout" src/components/property` returns nothing user-facing, and every number on a listing page traces to a DB row.

### Week 2 — Data correctness
- [ ] Migration `phase15`: `last_seen_at`, `is_active`, a `market_stats` view (percentile_cont), an `area_rent_history` daily snapshot table, and the area-watch unique-index fix
- [ ] Switch the listings page, `/insights` and the detail page to the view; cookie-less client on `/insights`
- [ ] Scraper marks rows inactive when not seen for 14 days

### Week 3 — Retention loop
- [ ] Daily cron: match new active listings to `area_watches` and send one digest email via Resend with an unsubscribe link (add `unsubscribe_token`)
- [ ] Contact-reveal and alert-click events in analytics

### Week 4 — AI fair-rent checker
- [ ] `/check` page: paste a link or text → parse (LLM) → SQL median → verdict, comps, 3 cheaper alternatives, negotiation script
- [ ] Shareable result card (OG image) for WhatsApp/X
- [ ] Rate limit plus a cache of parsed URLs

### Weeks 5–6 — SEO + open data + launch
- [ ] `/bangalore/rent/[area]/[bhk]` pages with trend charts from `area_rent_history`
- [ ] Open dataset Action (CSV/Parquet aggregates, CC-BY) and a static chart page
- [ ] Anonymous "What do you pay?" submission ("asking vs actually paid")
- [ ] Launch day: Show HN + r/bangalore data post + X thread; then a monthly rent report

### Later
- [ ] Mobile filter drawer; `/properties` h1; per-page titles; `middleware.ts` → `proxy.ts`
- [ ] WhatsApp bot; landlord stats dashboard; second city

### Metrics to watch (`analytics_daily_summary`)
WAS, area-watch signups per week, alert click-through, `/check` uses per day,
shares, GitHub stars per day around launch.
