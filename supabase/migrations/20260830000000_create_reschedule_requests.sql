-- Migration: create reschedule_requests table and RLS policies

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS public.reschedule_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.puja_bookings(id) ON DELETE CASCADE,
  requested_date date NOT NULL,
  requested_time time without time zone NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own requests
CREATE POLICY "Users can create their reschedule requests" ON public.reschedule_requests
FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()));

-- Allow users to view their own requests
CREATE POLICY "Users can view their own reschedule requests" ON public.reschedule_requests
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()));

-- Allow admins to manage (select, update) all requests
CREATE POLICY "Admins can manage reschedule requests" ON public.reschedule_requests
FOR ALL
TO public
USING (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])))))
WITH CHECK (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])))));

COMMIT;
