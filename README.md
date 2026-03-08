# RentWise - Premium Rental Platform

A modern, fast, and secure rental property finding platform designed for tenants and landlords. Entirely refactored into a single **Next.js 15 (App Router)** structure utilizing **Supabase** for database management and Server Side Authentication.

## Features & CRUD

- **Create**: Landlords can list properties with rent, size, photos, location info, and google map endpoints via the **Landlord Dashboard**.
- **Read**: Tenants and general users can browse, filter (by area, property type, price limits) via the beautifully styled **Properties List** and view full details without ever needing to log in. Includes dynamic **AI-Matched percentage scores**.
- **Update/Delete**: Landlords can manage, view, and safely **Delete** their listed properties directly from the authenticated Dashboard view.
- **Auth**: Safe, JWT-backed Supabase cookie-authenticated middleware guaranteeing fast load times and impenetrable route guarding.
- **Design System**: Tailored with premium Vanilla-like Tailwind CSS tokens including distinct `glass` UI components, beautiful grid card alignments, hover scaling micro-animations, and complete viewport **Mobile Responsiveness**.

---

## Technical Stack
- **Framework**: Next.js 15+ (App Router, strict SSR & Client Boundary Separation)
- **Language**: TypeScript (TSX)
- **Styling**: Tailwind CSS (Premium Tokens)
- **Backend / Database**: Supabase (PostgreSQL + Auth SSR plugin)
- **Infrastructure**: NGINX & Node.js Docker containers 
- **CI/CD Pipeline**: GitHub Actions auto-deploy pipeline targeting DigitalOcean droplets.

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/devag7/rentwise.git
   cd rentwise
   ```

2. **Configure Environment Variables**:
   In the root directory, create a `.env` file containing your Supabase connection parameters:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

3. **Install Dependencies and Run Locally**:
   ```bash
   cd rentwise-next
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` to view it locally.

---

## Deployment to Production (DigitalOcean)
This repository is pre-configured for a highly memory-constrained VPS (e.g., 1 VCPU, 2GB RAM). 

You can automatically deploy simply by pushing to `main` **OR** manually by running Docker Compose on the droplet:
```bash
docker compose up -d --build
```
The application will safely spin up and bind exactly to **Port 3009** for external access.

---

### File Architecture Breakdown
- `rentwise-next/src/app/page.tsx`: Premium Landing page.
- `rentwise-next/src/app/properties/page.tsx`: Property exploration (SSG+Client Side Filtering).
- `rentwise-next/src/app/dashboard/page.tsx`: Landlord restricted CRUD view.
- `rentwise-next/src/components/*`: Reusable dynamic UI fragments (`PropertyCard`, `FilterBar`, `Navbar`).
- `docker-compose.yml` & `deploy.yml`: Production Docker + GitHub orchestration scripts.

*Developed specifically to ensure an ultra-fast, "crazy result", pixel-perfect user experience.*
