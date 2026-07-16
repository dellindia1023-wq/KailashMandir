-- Enable row-level security and policies for about_settings

-- Enable RLS
ALTER TABLE IF EXISTS public.about_settings ENABLE ROW LEVEL SECURITY;

-- Allow public SELECTs (clients can read About page)
CREATE POLICY IF NOT EXISTS "about_select" ON public.about_settings
  FOR SELECT
  USING (
    true
  );

-- Allow admins and super_admins to insert
CREATE POLICY IF NOT EXISTS "about_insert_admins" ON public.about_settings
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Allow admins and super_admins to update
CREATE POLICY IF NOT EXISTS "about_update_admins" ON public.about_settings
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Allow admins and super_admins to delete (if needed)
CREATE POLICY IF NOT EXISTS "about_delete_admins" ON public.about_settings
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );
