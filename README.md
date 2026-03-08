# RentWise 2.0: The Premium Property Tech Ecosystem

![RentWise](https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80)

RentWise is an ultra-premium, production-ready Real Estate application built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Defying standard constraints, version 2.0 introduces 15 state-of-the-art interactive modules, elevating property search from a standard web feed to an immersive, data-driven financial suite.

## The 15 Premium Modules

### I. The Deep User Ecosystem
1. **Dual-Role Authentication Portals**: Distinct, fully integrated `/login/tenant` and `/login/landlord` hub entrances scaling specific roles dynamically at the session level via Supabase SSR.
2. **Dashboard Analytics Engine**: A real-time Landlord Dashboard summarizing total properties, application leads, metrics, and bookmark saves.
3. **Formal Application Vault**: A complex form mechanism on property details pages allowing tenants to officially apply with Intent, Move-In Date, and natively encrypted document uploads.
4. **KYC Secure Digital Vault**: Custom logic funneling ID/Salary PDF proof directly to Supabase Storage's secured RLS `kyc_documents` bucket.
5. **Real-time Pipeline Tracking**: Dashboards for Landlords to Approve/Reject applications with seamless UX, alongside Tenant transparency tracking vectors.

### II. Interactive Property Tools
6. **Geo Matrix (Mapbox Cluster)**: A gorgeous, dark-mode Geo Matrix visualization built on Mapbox GL JS, serving as an interactive alt-view to the standard Data Grid.
7. **Virtual Tour Integrator**: Bridged standard properties to 3D Space leveraging embedded Matterport Showcase iFrames loaded in an ultra-sleek full-screen dark modal.
8. **Neural Match Recommendations**: An autonomous data fetcher that queries the Supabase graph to recommend 3 algorithmically matched properties based on location matrices.
9. **Commute Distance Analyzer**: An interactable algorithmic display returning simulated distance, drive time, and public transit equations against user-specified workplace POIs.

### III. The Financial Suite
10. **Encrypted Live Comms Matrix**: A complete Real-time peer-to-peer Messaging app (`/messages`) utilizing Supabase Postgres real-time channels for instant Tenant-Landlord communication.
11. **Cryptographic Lease Generator**: Implements `jspdf` to compile approved applications into beautiful, structured, and instantly downloadable Legal Agreements right from the unified dashboard.
12. **Stripe Secure Escrow Simulation**: Integrated UI permitting Tenants to digitally authorize their two-month security deposit via a highly realistic Stripe TestNet masking flow.
13. **Affordability Risk Calculator**: A dynamic tool requiring Net Income input to mathematically visualize a unified Rent-To-Income risk ratio via animated gauges.

### IV. Community & Environment
14. **Guided Tour Protocols**: Synthesized time block scheduler targeting specific properties, allowing tenants to officially sync viewings with property agents.
15. **Neighborhood Intelligence Profiles**: Twin analytics modules (`NeighborhoodProfiles` & `PropertyReviews`) detailing dynamic transit/safety scores and 5-star weighted cryptographically verified social reviews.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Language**: TypeScript (Strict typing enforced)
- **Styling**: Tailwind CSS (Custom Dark Mode Aesthetics)
- **Database & Auth**: Supabase (PostgreSQL, Realtime, Storage, SSR Auth)
- **Maps**: Mapbox GL JS (`react-map-gl`)
- **PDF Generation**: jsPDF
- **Alerts**: `react-hot-toast`
- **Deployments**: Docker, DigitalOcean, GitHub Actions CI/CD

## 🚀 Quick Start Guide

### 1. Environmental Configuration
Clone the repository and set up your `.env.local` inside the `rentwise-next` directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### 2. Install & Execute
```bash
cd rentwise-next
npm install
npm run dev
```
The server will deploy mapping logic on [http://localhost:3000](http://localhost:3000).

---

## 🏗 Architecture & Code Quality

The RentWise codebase strictly adheres to an SDE3 industrial-standard micro-component level refactoring setup. Files are massively decoupled:
- `src/app`: Contains Next.js 15 Server-side route groupings.
- `src/components/property`: Houses 10+ modular interactive tech tools (`ApplicationCard`, `MapboxCluster`, `TourScheduler`, etc).
- `src/components/dashboard`: Strict separation of Landlord vs Tenant analytic readouts.
- `src/utils`: Contains Supabase SSR instantiation scripts and jsPDF generators. 

## 📝 API & Database Matrix
For the overarching list of Supabase API endpoints and detailed PostgreSQL table structures, please refer to the adjoining `API_REFERENCE.md` module in the root directory.

> Designed with precision to establish the new gold standard for interactive Real Estate software platforms.
