# RentWise — Dev → Live → Real Users at Scale

_Execution plan. Product first; every phase ends with something users feel._
_Companion: STRATEGY.md (positioning/metrics), brand/ (identity)._

## Phase 0 — Shipped ✅

- CI→GHCR→pull deploy pipeline, smoke-tested every push
- Health endpoint, error/404 pages, security headers
- First-party analytics (page views, signups, logins, shares)
- Comps-based fair-rent verdicts on cards + detail pages
- WhatsApp share with verdict text
- SEO: sitemap, robots, per-listing metadata, RealEstateListing JSON-LD, Organization/WebSite JSON-LD
- LLM-SEO: /llms.txt for AI crawlers

## Phase 1 — Launchable (BLOCKED ON OWNER, ~1 day of owner time)

The site lives on a bare IP. **Search engines will not rank `157.245.110.163:3009` and users won't trust it.** Until this phase closes, all SEO work is dormant potential.

Owner checklist (in order):
1. **Buy domain** — rentwise.in (or .co.in / getrentwise.com). ~₹800/yr.
2. **Cloudflare free tier** — point DNS to droplet, enable proxy: free HTTPS, CDN, DDoS protection.
3. Droplet: nginx (or Caddy) reverse proxy 80/443 → 3009; or change compose to 80. Caddy = 2-line config with auto-TLS if Cloudflare set to "Full".
4. Set `NEXT_PUBLIC_SITE_URL=https://yourdomain` in droplet `.env` + GitHub variable; redeploy (sitemap/canonical/OG all pick it up automatically).
5. **Google Search Console** — verify domain, submit sitemap.xml.
6. Supabase → Auth → URL config: set site URL to domain (fixes email confirm links).
7. Rotate the exposed Apify token; unlink the two stale Netlify sites.

## Phase 2 — Retention loops (next dev work, ~1 week)

Priority order (each = one deployable PR):
1. **Saved-search alerts** — table `saved_searches` + daily cron email "3 new under-market 2BHKs in HSR". THE retention loop. Needs: Supabase SMTP or Resend free tier (owner: pick sender domain).
2. **Price-history per area** — we scrape twice daily; start materializing `area_rent_history` (area, type, median, count, date). Becomes proprietary charts no competitor publishes. Pure SQL + cron, zero new infra.
3. **Landlord dashboard stats** — views/saves/contacts per listing (analytics_events already captures the raw events). Supply-side retention.
4. **Contact-reveal event** + soft signup prompt after N reveals — converts anonymous traffic to accounts without forced login.

## Phase 3 — Programmatic SEO (after domain, ~1 week)

- `/bangalore/rent/[area]` landing pages: median rent, trend chart, live listings, FAQ with JSON-LD FAQPage. 10 areas × 4 configs = 40 indexable pages targeting "1bhk rent indiranagar" queries.
- Auto-generated monthly "Bangalore Rent Report" page from scrape data — linkable asset, the PR hook.
- llms.txt stays updated; add llms-full.txt with per-area data dumps for AI assistants.

## Phase 4 — Scale thresholds (act when metric crosses)

| Trigger | Action |
|---|---|
| >50k visits/mo or droplet RAM pressure | Upgrade droplet to 2GB ($12) — single biggest cheap win |
| Supabase free row/bandwidth limits near | Supabase Pro ($25/mo) |
| Scraper blocked more often | Apify residential proxy budget bump; add 3rd source (Housing.com) |
| >1k WAS | Postgres read replicas via Supabase; image proxy/cache for scraped photos |
| Fundraise conversations | STRATEGY.md metrics targets: 1k WAS, 15% w4 retention, 50 landlord listings |

## Operating cadence

- Every push: CI gates + live smoke tests (automated, exists).
- Weekly: check `analytics_daily_summary` — WAS, signup conversion, share count.
- Monthly: rent report publish (Phase 3 onward).

## Requirements gathered — everything still needed from owner

| # | Item | Cost | Blocks |
|---|---|---|---|
| 1 | Domain | ~₹800/yr | ALL of SEO, trust, email links |
| 2 | Cloudflare account (free) | 0 | HTTPS, CDN |
| 3 | Resend/SMTP sender (free tier) | 0 | Phase 2 alerts |
| 4 | Google Search Console verify | 0 | Indexing |
| 5 | Apify token rotation | 0 | Security hygiene |
| 6 | Netlify unlink ×2 | 0 | CI noise |
| 7 | Supabase auth URL → domain | 0 | Signup email links |
| 8 | Mac restart 🙂 | 0 | Local dev speed |
