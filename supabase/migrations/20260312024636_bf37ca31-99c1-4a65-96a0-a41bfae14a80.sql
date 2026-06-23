
-- Fix: The UPDATE policy needs both USING and WITH CHECK clauses
-- Also simplify to use has_role which already handles super_admin -> admin inheritance

DROP POLICY IF EXISTS "Different admin can approve role change" ON public.role_change_requests;

CREATE POLICY "Admins and Super Admin can update role requests"
ON public.role_change_requests
FOR UPDATE
TO authenticated
USING (
  -- Super admin can update any pending request
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  OR
  -- Regular admin can update requests they didn't create
  (has_role(auth.uid(), 'admin'::app_role) AND requested_by <> auth.uid() AND status = 'pending'::text)
)
WITH CHECK (
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  OR
  (has_role(auth.uid(), 'admin'::app_role) AND requested_by <> auth.uid())
);
