-- Fix homepage_settings table (remove failed migration constraints)
DROP TABLE IF EXISTS public.homepage_settings CASCADE;

-- Create homepage_settings table for CMS functionality
CREATE TABLE public.homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hero Section
  hero_title text NOT NULL DEFAULT 'Welcome to Kailash Mahadev Temple',
  hero_subtitle text NOT NULL DEFAULT 'Experience Divine Spirituality',
  hero_button_text text NOT NULL DEFAULT 'Book Puja',
  hero_button_link text NOT NULL DEFAULT '/pujas',
  hero_image_url text,
  
  -- Statistics Section
  years_of_heritage integer NOT NULL DEFAULT 200,
  daily_devotees integer NOT NULL DEFAULT 5000,
  days_open integer NOT NULL DEFAULT 365,
  
  -- Announcement
  announcement text,
  announcement_enabled boolean NOT NULL DEFAULT true,
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Only one active record should exist
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (everyone can read)
CREATE POLICY "Public read access"
  ON public.homepage_settings FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Admin and SuperAdmin can read all records
CREATE POLICY "Admin read access"
  ON public.homepage_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Policy: Only Admin and SuperAdmin can insert
CREATE POLICY "Admin insert access"
  ON public.homepage_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Policy: Only Admin and SuperAdmin can update
CREATE POLICY "Admin update access"
  ON public.homepage_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Policy: Only Admin and SuperAdmin can delete
CREATE POLICY "Admin delete access"
  ON public.homepage_settings FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create unique filtered index to ensure only one active record
CREATE UNIQUE INDEX idx_homepage_settings_only_active ON public.homepage_settings(is_active) WHERE is_active = true;

-- Create index on is_active for fast queries
CREATE INDEX idx_homepage_settings_active ON public.homepage_settings(is_active) WHERE is_active = true;

-- ============================================================================
-- Storage Bucket Setup for CMS Content (Images, etc.)
-- ============================================================================

-- Create content storage bucket for homepage CMS files
INSERT INTO storage.buckets (id, name, public)
VALUES ('content', 'content', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view content (public read)
CREATE POLICY "Public read content"
ON storage.objects
FOR SELECT
USING (bucket_id = 'content');

-- Policy: Admin and SuperAdmin can upload to content bucket
CREATE POLICY "Admin upload to content"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Policy: Admin and SuperAdmin can update content
CREATE POLICY "Admin update content"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'content' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'content' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Policy: Admin and SuperAdmin can delete from content
CREATE POLICY "Admin delete content"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'content' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);
