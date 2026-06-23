-- Fix knowledge_articles RLS policies to use user_roles table instead of JWT claim
-- This matches the pattern used in other tables

-- Drop old policies
DROP POLICY IF EXISTS "Public read knowledge articles" ON public.knowledge_articles;
DROP POLICY IF EXISTS "Admin manage knowledge articles" ON public.knowledge_articles;

-- Create new policies with proper user_roles table check
CREATE POLICY "Allow read knowledge_articles"
  ON public.knowledge_articles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow admin manage knowledge_articles"
  ON public.knowledge_articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow admin update knowledge_articles"
  ON public.knowledge_articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow admin delete knowledge_articles"
  ON public.knowledge_articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
