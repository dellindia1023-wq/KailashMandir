
-- Drop the overly permissive insert policy on audit_log
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_log;

-- Only admins can insert audit logs from the client side
-- Edge functions using service role key bypass RLS automatically
CREATE POLICY "Admins can insert audit logs"
ON public.audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));
