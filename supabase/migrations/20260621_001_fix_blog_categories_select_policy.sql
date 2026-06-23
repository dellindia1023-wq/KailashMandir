-- Drop existing restrictive policies and create new permissive ones
DROP POLICY IF EXISTS "Admin manage blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Public read blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Anyone can read blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admin can manage blog categories" ON public.blog_categories;

-- Allow everyone to read blog categories (they're public data)
CREATE POLICY "Anyone can read blog categories"
  ON public.blog_categories FOR SELECT
  TO public
  USING (true);

-- Allow inserts/updates/deletes only with admin role
CREATE POLICY "Admin can manage blog categories"
  ON public.blog_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
