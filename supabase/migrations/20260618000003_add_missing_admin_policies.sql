-- Migration: Add missing admin DELETE and UPDATE policies
-- Purpose: Allow admins to delete bookings and donations, and update donations
-- Date: 2026-06-18

-- Add admin DELETE policy for puja_bookings
CREATE POLICY "Admins can delete bookings"
  ON public.puja_bookings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Add admin DELETE policy for donations
CREATE POLICY "Admins can delete donations"
  ON public.donations FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Add admin UPDATE policy for donations (allows admins to correct donation records)
CREATE POLICY "Admins can update any donation"
  ON public.donations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Add updated_at column to donations table for audit trail
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for automatic timestamp updates on donations
CREATE OR REPLACE FUNCTION public.update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_donations_updated_at ON public.donations;

CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_donations_updated_at();

-- Add recommended performance indexes
CREATE INDEX IF NOT EXISTS idx_puja_bookings_payment_status
  ON public.puja_bookings(payment_status);

CREATE INDEX IF NOT EXISTS idx_puja_bookings_booking_date
  ON public.puja_bookings(booking_date);

CREATE INDEX IF NOT EXISTS idx_puja_bookings_user_id
  ON public.puja_bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_donations_status
  ON public.donations(status);

CREATE INDEX IF NOT EXISTS idx_donations_user_id
  ON public.donations(user_id);

CREATE INDEX IF NOT EXISTS idx_donations_created_at
  ON public.donations(created_at DESC);
