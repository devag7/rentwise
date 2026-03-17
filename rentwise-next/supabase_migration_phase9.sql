-- Phase 9: NoBroker Scraper Migration
-- Adds latitude/longitude columns needed for real geo coordinates from scraped listings

-- 1. ADD COORDINATE COLUMNS TO PROPERTIES
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. CREATE INDEX FOR GEOSPATIAL QUERIES
CREATE INDEX IF NOT EXISTS idx_properties_coordinates 
ON public.properties (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
