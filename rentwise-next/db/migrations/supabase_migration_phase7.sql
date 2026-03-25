-- Phase 7: The Masterpiece Migration
-- This script creates the foundational relational tables required for the advanced rentwise ecosystem.

-- 1. APPLICATIONS VAULT & KYC
CREATE TABLE IF NOT EXISTS public.applications (
    application_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES public.properties(property_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL, -- References auth.users, but we store as UUID natively
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    intent_description TEXT,
    move_in_date DATE,
    kyc_document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Tenants can insert their own apps, view their own apps
CREATE POLICY "Tenants can insert applications" ON public.applications 
FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view own applications" ON public.applications 
FOR SELECT USING (auth.uid() = tenant_id);

-- Landlords can view apps for their properties
CREATE POLICY "Landlords can view apps for their properties" ON public.applications 
FOR SELECT USING (
    auth.uid() IN (SELECT landlord_id FROM public.properties WHERE property_id = applications.property_id)
);

-- Landlords can update app status
CREATE POLICY "Landlords can update apps for their properties" ON public.applications 
FOR UPDATE USING (
    auth.uid() IN (SELECT landlord_id FROM public.properties WHERE property_id = applications.property_id)
);


-- 2. REAL-TIME MESSAGING
CREATE TABLE IF NOT EXISTS public.messages (
    message_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES public.properties(property_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can insert messages if they are sender
CREATE POLICY "Users can insert messages" ON public.messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can read messages if they are sender or receiver
CREATE POLICY "Users can view messages" ON public.messages 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- 3. TOUR SCHEDULING CALENDAR
CREATE TABLE IF NOT EXISTS public.tours (
    tour_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES public.properties(property_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    requested_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Tours
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can request tours" ON public.tours 
FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view own tours" ON public.tours 
FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view tours for their properties" ON public.tours 
FOR SELECT USING (
    auth.uid() IN (SELECT landlord_id FROM public.properties WHERE property_id = tours.property_id)
);

CREATE POLICY "Landlords can update tours for their properties" ON public.tours 
FOR UPDATE USING (
    auth.uid() IN (SELECT landlord_id FROM public.properties WHERE property_id = tours.property_id)
);


-- 4. RATINGS & REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES public.properties(property_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);

-- Tenants can add reviews
CREATE POLICY "Tenants can insert reviews" ON public.reviews 
FOR INSERT WITH CHECK (auth.uid() = tenant_id);


-- Set up Storage Bucket for KYC Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage (Assuming usage of authenticated roles)
CREATE POLICY "Authenticated users can upload KYC"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc_documents');

CREATE POLICY "Users can view own KYC or Landlords can view"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc_documents');
