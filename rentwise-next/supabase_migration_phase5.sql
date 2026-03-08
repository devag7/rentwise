-- Phase 5 Production Polish Migration
-- Run this in your Supabase SQL Editor to support the new features.

-- 1. Add advanced schema to the existing properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS furnishing_status TEXT DEFAULT 'Unfurnished',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- 2. Create Favorites table for tenants
CREATE TABLE IF NOT EXISTS public.favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES public.properties(property_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, property_id)
);

-- Note: Ensure Row Level Security (RLS) is disabled or properly configured for `favorites`
-- If you have RLS enabled by default, you might want to run:
-- ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage their own favorites" ON public.favorites
--   FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own favorites" ON public.favorites
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
