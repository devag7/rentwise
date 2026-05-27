-- Phase 10: Security Hardening Migration
-- This script patches critical vulnerabilities in RLS and Storage policies

-- 1. Secure KYC Documents Bucket
-- The previous policy allowed ANY authenticated user to read ALL documents.
-- We must restrict this so only the document owner or landlords can read it.
-- But since storage policies on `bucket_id` are global, we need a better check.
-- We will use path checking (assuming path is something like user_id/document.pdf)
-- Or, restrict read access completely unless explicitly granted by a server action
-- Since Next.js uses service_role key for secure operations, we can drop public SELECT access.

DROP POLICY IF EXISTS "Users can view own KYC or Landlords can view" ON storage.objects;

CREATE POLICY "Users can only view their own KYC documents" 
ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'kyc_documents' 
    AND auth.uid() = owner
);

-- Note: Ensure that when KYC documents are uploaded, the `owner` column is set correctly by Supabase.

-- 2. Secure Favorites Table
-- In Phase 5, RLS was disabled/commented out.
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;

CREATE POLICY "Users can manage their own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Secure Properties Table
-- Ensure properties are viewable by all, but only modifiable by the landlord
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can delete own properties" ON public.properties;

CREATE POLICY "Anyone can view properties" ON public.properties
  FOR SELECT USING (true);

CREATE POLICY "Landlords can insert properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() = landlord_id);

