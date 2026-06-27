-- Add optional media fields for blog and knowledge content to support richer CMS workflows
ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS featured_video_url TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_caption TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT;

ALTER TABLE public.knowledge_articles
  ADD COLUMN IF NOT EXISTS featured_video_url TEXT;
