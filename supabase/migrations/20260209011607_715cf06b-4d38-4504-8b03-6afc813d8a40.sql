CREATE POLICY "Admins can view all donations"
ON public.donations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));