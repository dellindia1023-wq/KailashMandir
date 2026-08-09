-- Add additional charge metadata for puja bookings and booking settings
ALTER TABLE public.puja_bookings
  ADD COLUMN IF NOT EXISTS additional_charges JSONB;

ALTER TABLE public.puja_booking_settings
  ADD COLUMN IF NOT EXISTS additional_charges JSONB;
