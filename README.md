# RentWise 2.0 (Next.js + Supabase Edition) 🚀

Welcome to **RentWise**, a premium, production-ready real estate platform strictly designed with industry-standard patterns and a high-end monochrome aesthetic.

RentWise has been fully migrated from a basic Node.js MVP to a scalable, Server-Rendered React application utilizing **Next.js 15 App Router** and **Supabase (PostgreSQL)**.

## 🌟 Unique Features & Industry Standards

We've specifically tailored this platform to be "best-in-class" by eliminating generic clutter and focusing entirely on high-capability features:

- **AI PropScore™ Algorithm:** Properties display an exclusive "Match Score" calculated dynamically against the market's standard base-rates, helping tenants spot good deals instantaneously.
- **Enterprise UI/UX Pipeline:** The platform leverages a strict `#111` dark-mode layout. We uninstalled all default browser `alert()` popups in favor of `react-hot-toast` notifications.
- **Multi-Role Dashboards (RLS Secured):**
  - **Tenants:** Enjoy a personalized "Saved Coordinates" view by favoriting properties with an interactive heart toggle.
  - **Landlords:** Access a stark "Terminal Upload" layout to initialize complex object nodes without clutter.
- **Advanced Dynamic Filtering:** Tenants can rapidly toggle exact specs (Bathrooms, Parking allocations, Furnishing stats) and Sort via Native Supabase Joins avoiding N+1 API issues.
- **Direct Base64 Imagery:** Bypassed expensive third-party S3 bucket costs for MVP deployments by safely injecting image binary streams via Supabase tables.

## 🏗️ Architecture & Code Structure

The entire application relies on modernized React Server Components to reduce the client-side JavaScript bundle.

- `/rentwise-next/src/app` - Contains all SEO-optimized Next.js pages.
- `/rentwise-next/src/components` - Isolated, reusable TSX elements structured via Tailwind rules.
- `/rentwise-next/src/utils/supabase` - Industry-standard `@supabase/ssr` client implementations for both Browser Contexts and Server Contexts.
- `API_REFERENCE.md` - Documentation of all database interaction endpoints.
- `supabase_migration_phase5.sql` - The definitive PostgreSQL architecture file establishing the database structure, logic, and relationships.

## 🚀 Quick Start / Deployment

This application comes with a production-ready `Dockerfile` and a GitHub Actions workflow (`deploy.yml`). Pushing to the `main` branch will automatically pull and serve your application on DigitalOcean.

**To run the frontend locally for development:**

```bash
cd rentwise-next
npm install
npm run dev
```

Remember to populate your `.env.local` file with your exact Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
# Needed for the seeding script
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY] 
```

## 📊 Seeding Initial Mock Data
If you have just executed your SQL Migration and the site is empty, run the custom populator utilizing the Next.js service roles (run locally on your machine):

```bash
cd rentwise-next
npm install dotenv @supabase/supabase-js
node scripts/seed.js
```
*This downloads High-Res luxury housing imagery via Unsplash and populates the platform securely so you have content to display.*

---

**Built by Antigravity / DeepMind.** Designed for maximum impact with minimum noise.
