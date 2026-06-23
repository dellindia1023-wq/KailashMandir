-- Blog System Migration for Kailash Mahadev Temple

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create blog_tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured BOOLEAN DEFAULT FALSE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create junction table for blogs and tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.blog_tag_relationships (
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, tag_id)
);

-- Create knowledge_articles table
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  search_keywords TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords_field TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category_id ON public.blogs(category_id);
CREATE INDEX IF NOT EXISTS idx_blogs_created_by ON public.blogs(created_by);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON public.knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_search ON public.knowledge_articles USING GIN(to_tsvector('english', question || ' ' || answer || ' ' || search_keywords));

-- Enable Row Level Security (RLS)
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tag_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Public read blog categories"
  ON public.blog_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin manage blog categories"
  ON public.blog_categories FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'));

-- RLS Policies for blog_tags
CREATE POLICY "Public read blog tags"
  ON public.blog_tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin manage blog tags"
  ON public.blog_tags FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'));

-- RLS Policies for blogs
CREATE POLICY "Public read published blogs"
  ON public.blogs FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Admin read all blogs"
  ON public.blogs FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'));

CREATE POLICY "Admin manage blogs"
  ON public.blogs FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'));

-- RLS Policies for blog_tag_relationships
CREATE POLICY "Public read blog tag relationships"
  ON public.blog_tag_relationships FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin manage blog tag relationships"
  ON public.blog_tag_relationships FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'));

-- RLS Policies for knowledge_articles
CREATE POLICY "Public read knowledge articles"
  ON public.knowledge_articles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin manage knowledge articles"
  ON public.knowledge_articles FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'))
  WITH CHECK (auth.jwt() ->> 'user_role' IN ('admin', 'super_admin'));

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
  BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
