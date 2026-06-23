
-- Allow super_admin to approve any role change request (including their own)
DROP POLICY IF EXISTS "Different admin can approve role change" ON public.role_change_requests;

CREATE POLICY "Different admin can approve role change"
ON public.role_change_requests
FOR UPDATE
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND (requested_by <> auth.uid()) AND (status = 'pending'::text))
  OR
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') AND status = 'pending'::text)
);

-- Also let super_admin create role change requests (already covered by admin policy, but explicit)
DROP POLICY IF EXISTS "Admins can create role change requests" ON public.role_change_requests;

CREATE POLICY "Admins can create role change requests"
ON public.role_change_requests
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
