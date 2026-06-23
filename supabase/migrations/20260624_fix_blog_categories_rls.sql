-- Update RLS policies to check user_roles table instead of JWT claim
-- Drop old policies that rely on JWT claims
DROP POLICY IF EXISTS "Admin manage blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admin manage blog_tags" ON public.blog_tags;
DROP POLICY IF EXISTS "Admin manage blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admin manage blog_tag_relationships" ON public.blog_tag_relationships;
DROP POLICY IF EXISTS "Admin manage knowledge articles" ON public.knowledge_articles;

-- Blog Categories RLS
CREATE POLICY "Admin manage blog categories"
  ON public.blog_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Blog Tags RLS
CREATE POLICY "Admin manage blog_tags"
  ON public.blog_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Blogs RLS (allow public read of published blogs)
DROP POLICY IF EXISTS "Public read published blogs" ON public.blogs;
CREATE POLICY "Public read published blogs"
  ON public.blogs FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Admin manage blogs"
  ON public.blogs FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Blog Tag Relationships RLS
CREATE POLICY "Admin manage blog_tag_relationships"
  ON public.blog_tag_relationships FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Knowledge Articles RLS
CREATE POLICY "Admin manage knowledge_articles"
  ON public.knowledge_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Grant admin role to test user
INSERT INTO public.user_roles (user_id, role)
VALUES ('8a7aa499-a5ae-4847-a4d2-ddf4d23f7786'::uuid, 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;
