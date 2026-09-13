-- Restrict unrestricted donation deletion to Super Admins.
DROP POLICY IF EXISTS "Admins can delete donations" ON public.donations;

CREATE POLICY "Admins can delete pending donations and super admins can delete any"
  ON public.donations FOR DELETE
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'admin')
      AND status = 'pending'
    )
  );