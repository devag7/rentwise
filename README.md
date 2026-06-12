# RentWise 2.0 - Premium Real Estate Engine

RentWise is a Next.js 16 powered real-estate platform designed with robust Server Components, fluid Framer Motion micro-animations, and a highly secure Supabase backend. It features an automated data ingestion pipeline powered by Apify to scrape properties in real-time.

## 🚀 Key Features
- **Server-Side Rendered:** `app/properties/page.tsx` directly queries the database server-side for blisteringly fast SEO and load times.
- **Automated Data Pipeline:** A built-in Node.js scraper script triggers an Apify Actor to scrape NoBroker listings and syncs them directly to the Supabase database.
- **Secure Backend:** Implements rigorous Row Level Security (RLS) policies on Supabase to ensure tenant/landlord data isolation and fix KYC document leaks.
- **Fluid UI:** Powered by Tailwind CSS and Framer Motion for a premium, investor-ready user experience.

---

## 🛠️ Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory. **Note: For production on your DigitalOcean Droplet, the droplet already has the full `.env` configured, so you do NOT need to set these manually on the droplet.**

```env
# Your actual Supabase URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Your actual Supabase ANON KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

# Your Mapbox Token (Optional for Maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk...

# Required ONLY for running the Apify sync script manually
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
APIFY_API_TOKEN=apify_api_...
```

### 3. Run the Development Server
```bash
npm run dev
```

---

## 🤖 Apify Automation Pipeline (Docker Native Setup)

The scraper uses your `APIFY_API_TOKEN` to completely automate property ingestion. We have integrated the cron scheduler **directly into the Docker container**. 

### How it Works (Zero-Touch):
1. When your Droplet starts the application via `docker-compose up -d`, the `entrypoint.sh` script automatically launches the cron scheduler in the background.
2. The cron scheduler (`scripts/cron.ts`) runs twice a day (6:00 AM and 6:00 PM IST).
3. It seamlessly executes both the MagicBricks scraper and the Apify NoBroker scraper using your existing `.env` credentials passed via `docker-compose.yml`.

There is absolutely **nothing** you need to manually schedule on your Droplet!

### Manual Trigger (Optional)
If you ever want to force a scrape immediately without waiting for the schedule, you can run this command on your droplet:
```bash
docker exec -it rentwise_next_app npm run scrape
```

---

## ✅ CI/CD Pipeline

Every push to `main` runs through `.github/workflows/deploy.yml`:

1. **CI** — `npm run lint`, `npm run typecheck`, `npm run build` (placeholder env; real values live only on the droplet).
2. **Deploy** — SSH into the droplet, `git reset --hard origin/main`, `docker-compose up -d --build` (no downtime `down` step).
3. **Smoke** — waits for `/api/health`, then runs the Playwright e2e suite against the live site. A failed smoke run flags the deploy red in GitHub.

Pull requests run the CI job only.

## 🧪 Testing

```bash
npm run test:e2e                                          # against live droplet
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e # against local build
```

## 📊 Analytics

First-party analytics events (page views, signups, logins) are written to the `analytics_events` Supabase table (`db/migrations/supabase_migration_phase11_analytics.sql` — run it once in the Supabase SQL editor). Query `analytics_daily_summary` for daily uniques per event.
