# RentWise — Competitive Position & Pre-Seed Roadmap

_Last updated: June 2026_

## Competitive landscape (Bangalore rentals)

| Player | Moat | Weakness RentWise can exploit |
|---|---|---|
| NoBroker | Zero-brokerage brand, ~10M monthly visitors, services layer (rent agreements, payments, movers), 4.6★ app | Listing quality degrades at scale; owner spam; upsell fatigue |
| MagicBricks | Largest national inventory | Broker-heavy, forced login before contact details, dated UX |
| Housing.com | Best-in-class UX | "Owner" listings often disguised brokers; aggressive data collection |
| 99acres | SEO + brand age | Same broker noise; weak rental focus |

## Where RentWise wins

1. **Rent intelligence, not classifieds.** Investors in 2025-26 reward transaction-led / data-led models over listing portals. RentWise's scraped multi-source dataset (NoBroker + MagicBricks) + algorithmic fair-value pricing is the wedge: "KNOW what it's worth."
2. **No forced login.** Browse, map, commute analysis with zero data hostage-taking — direct counter to MagicBricks/99acres dark patterns.
3. **Verified-by-pipeline.** Zero-fake-data scraper policy = listing fields are never invented. Surface this as a trust badge.

## Pre-seed traction plan (what investors will ask)

Stage gates (per 2026 pre-seed norms: team + wedge + early engagement signals):

- **North-star metric:** weekly active searchers (WAS) in Bangalore.
- **Supporting:** signup conversion (page_view → signup), listing detail CTR, application submissions, landlord-side listings created, 4-week retention.
- All of these are already instrumented via `analytics_events` (page_view / signup / login) — extend with `application_submitted`, `listing_created`, `contact_revealed`.

Targets to credibly raise pre-seed (~₹50L–₹2Cr / $100-250k):
- 1,000+ WAS, 15%+ week-4 retention, 50+ landlord listings, one repeatable acquisition channel (SEO via sitemap/listing pages is the cheapest — already shipped).

## Product roadmap (sequenced)

**Now → 1 month (trust + retention)**
- Saved searches + email alerts (drives weekly return visits)
- Rent fair-value badge on every listing (under/over-priced vs model)
- WhatsApp share deep links (dominant channel in India)

**1-3 months (transaction wedge)**
- Rent agreement generation (jspdf already in repo → upgrade to legally-valid templates + eSign partner)
- Application → landlord approval → digital lease flow end-to-end (skeleton exists: applications, PaymentModal, generateLease)
- Tenant verification (KYC upload exists; add status workflow)

**3-6 months (scale + moat)**
- Expand scraping to 2nd city (pipeline is city-agnostic; areas table already abstracts locality)
- Price-history charts per locality from accumulated scrape data — proprietary dataset nobody else publishes
- Landlord dashboard analytics (views/contacts per listing) — retention hook for supply side

## Infra scaling checkpoints

- Current: 1 droplet, Docker, Supabase free tier. Fine to ~50k monthly visits.
- Next: move image to GHCR + pull on droplet (no on-box builds), add CDN (Cloudflare free) + domain + HTTPS before any paid marketing.
- Supabase Pro when analytics_events exceeds free-tier row limits.
