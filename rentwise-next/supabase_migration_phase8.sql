-- Phase 8: Automated Scraper Migration
-- Adds columns needed for scraped vs platform listings and expands Bangalore area coverage

-- 1. ADD SCRAPER COLUMNS TO PROPERTIES
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'platform';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create unique index for deduplication of scraped listings
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_external_id ON public.properties (external_id) WHERE external_id IS NOT NULL;

-- 2. EXPAND AREAS TABLE TO COVER ALL OF BANGALORE (40+ localities)
-- Using ON CONFLICT to avoid duplicates if areas already exist
INSERT INTO public.areas (name) VALUES
  ('Indiranagar'), ('Koramangala'), ('Whitefield'), ('HSR Layout'),
  ('Marathahalli'), ('Bellandur'), ('Jayanagar'), ('BTM Layout'),
  ('Electronic City'), ('Banashankari'), ('Rajajinagar'), ('Malleshwaram'),
  ('Basavanagudi'), ('Sadashivanagar'), ('Hebbal'), ('Yelahanka'),
  ('Hennur'), ('Thanisandra'), ('Sarjapur Road'), ('Kanakapura Road'),
  ('Bannerghatta Road'), ('JP Nagar'), ('Vijayanagar'), ('Yeshwanthpur'),
  ('Nagarbhavi'), ('Peenya'), ('Dasarahalli'), ('Mahadevapura'),
  ('KR Puram'), ('Brookefield'), ('ITPL'), ('Hoodi'),
  ('Bommanahalli'), ('Begur'), ('Hulimavu'), ('Uttarahalli'),
  ('Kengeri'), ('Rajarajeshwari Nagar'), ('Mysore Road'), ('Tumkur Road'),
  ('Devanahalli'), ('Hoskote'), ('Old Airport Road'), ('CV Raman Nagar'),
  ('Frazer Town'), ('RT Nagar'), ('Kammanahalli'), ('Kalyan Nagar'),
  ('Banaswadi'), ('Ramamurthy Nagar')
ON CONFLICT (name) DO NOTHING;

-- 3. UPDATE RLS: Allow service role to insert scraped properties
-- The scraper uses the service_role key which bypasses RLS automatically,
-- so no additional policies needed.
