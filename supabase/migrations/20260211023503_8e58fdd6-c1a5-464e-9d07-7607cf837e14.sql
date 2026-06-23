-- Allow users to update their own donations (needed for payment verification)
CREATE POLICY "Users can update their own donations"
ON public.donations
FOR UPDATE
USING (auth.uid() = user_id);