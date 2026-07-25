-- Drop existing restrictive policies and create new permissive ones
DROP POLICY IF EXISTS "Admin manage blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Public read blog categories" ON public.blog_categories;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'blog_categories'
      AND policyname = 'Anyone can read blog categories'
  ) THEN
    CREATE POLICY "Anyone can read blog categories"
      ON public.blog_categories FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'blog_categories'
      AND policyname = 'Admin can manage blog categories'
  ) THEN
    CREATE POLICY "Admin can manage blog categories"
      ON public.blog_categories FOR ALL
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
      );
  END IF;
END
$$;
