-- Add columns to puja_bookings for priest assignment and status tracking
ALTER TABLE public.puja_bookings 
ADD COLUMN IF NOT EXISTS assigned_priest_id uuid,
ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'pending';

-- Create index for faster priest queries
CREATE INDEX IF NOT EXISTS idx_puja_bookings_assigned_priest ON public.puja_bookings(assigned_priest_id);

-- RLS policy: Priests can view their assigned bookings
CREATE POLICY "Priests can view assigned bookings"
ON public.puja_bookings
FOR SELECT
USING (
  assigned_priest_id = auth.uid() 
  AND has_role(auth.uid(), 'priest')
);

-- RLS policy: Priests can update status of their assigned bookings
CREATE POLICY "Priests can update assigned booking status"
ON public.puja_bookings
FOR UPDATE
USING (
  assigned_priest_id = auth.uid() 
  AND has_role(auth.uid(), 'priest')
);

-- Update admin policy to view ALL pujas (including inactive)
DROP POLICY IF EXISTS "Admins can view all pujas" ON public.pujas;
CREATE POLICY "Admins can view all pujas"
ON public.pujas
FOR SELECT
USING (has_role(auth.uid(), 'admin'));