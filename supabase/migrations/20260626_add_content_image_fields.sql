-- Add optional image metadata columns for blog and knowledge content
ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS image_alt TEXT;

ALTER TABLE public.knowledge_articles
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT;
