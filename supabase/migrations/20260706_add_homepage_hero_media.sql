-- Add nullable hero_images JSON field to homepage_settings for enhanced hero carousel support
ALTER TABLE public.homepage_settings
  ADD COLUMN IF NOT EXISTS hero_images JSONB;
