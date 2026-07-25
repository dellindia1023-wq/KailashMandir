-- Add slug support for knowledge articles
ALTER TABLE public.knowledge_articles
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs from question when missing, ensuring uniqueness
WITH base_slugs AS (
  SELECT
    id,
    CASE
      WHEN TRIM(COALESCE(question, '')) = '' THEN
        'knowledge-article-' || id::text
      ELSE
        LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(question), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
    END AS base_slug
  FROM public.knowledge_articles
  WHERE slug IS NULL OR slug = ''
),
ranked_slugs AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS slug_rank
  FROM base_slugs
)
UPDATE public.knowledge_articles AS k
SET slug = CASE
  WHEN rs.slug_rank = 1 THEN rs.base_slug
  ELSE rs.base_slug || '-' || rs.slug_rank::text
END
FROM ranked_slugs AS rs
WHERE k.id = rs.id;

-- Ensure remaining empty values get a fallback
UPDATE public.knowledge_articles
SET slug = 'knowledge-article-' || id::text
WHERE slug IS NULL OR slug = '';

DROP INDEX IF EXISTS public.idx_knowledge_articles_slug;

CREATE UNIQUE INDEX idx_knowledge_articles_slug
ON public.knowledge_articles(slug);

-- Make slug non-null for future rows by using a generated fallback on insert
CREATE OR REPLACE FUNCTION public.set_knowledge_article_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(NEW.question, 'knowledge-article'), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;

  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := 'knowledge-article-' || NEW.id::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_knowledge_article_slug ON public.knowledge_articles;

CREATE TRIGGER trg_set_knowledge_article_slug
BEFORE INSERT OR UPDATE OF slug, question ON public.knowledge_articles
FOR EACH ROW
EXECUTE FUNCTION public.set_knowledge_article_slug();
