-- Fix blog_categories RLS to allow authenticated users to read categories
ALTER TABLE public.blog_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read categories
CREATE POLICY "Allow read blog_categories" 
  ON public.blog_categories FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow admin to manage categories
CREATE POLICY "Allow admin manage blog_categories"
  ON public.blog_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
