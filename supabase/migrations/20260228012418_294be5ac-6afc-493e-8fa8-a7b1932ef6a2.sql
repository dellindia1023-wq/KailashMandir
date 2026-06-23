
-- 1. Replace permissive user UPDATE policy on puja_bookings to prevent payment field tampering
-- Drop existing user update policy
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.puja_bookings;

-- Users can only update non-payment fields on their own bookings
CREATE POLICY "Users can update own booking details"
ON public.puja_bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
);

-- Trigger to prevent users from changing payment fields
CREATE OR REPLACE FUNCTION public.protect_booking_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow admins to update anything
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Prevent non-admins from changing payment-related fields
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_id IS DISTINCT FROM OLD.payment_id
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.razorpay_signature IS DISTINCT FROM OLD.razorpay_signature
     OR NEW.amount IS DISTINCT FROM OLD.amount
  THEN
    RAISE EXCEPTION 'You are not authorized to modify payment fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_booking_payment ON public.puja_bookings;
CREATE TRIGGER trg_protect_booking_payment
  BEFORE UPDATE ON public.puja_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_booking_payment_fields();

-- 2. Replace permissive user UPDATE policy on donations to prevent status tampering
DROP POLICY IF EXISTS "Users can update their own donations" ON public.donations;

CREATE POLICY "Users can update own donation non-critical fields"
ON public.donations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger to prevent users from changing donation status/transaction fields
CREATE OR REPLACE FUNCTION public.protect_donation_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.transaction_id IS DISTINCT FROM OLD.transaction_id
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.amount IS DISTINCT FROM OLD.amount
  THEN
    RAISE EXCEPTION 'You are not authorized to modify payment fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_donation_payment ON public.donations;
CREATE TRIGGER trg_protect_donation_payment
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_donation_payment_fields();

-- 3. Avatar URL validation trigger
CREATE OR REPLACE FUNCTION public.validate_avatar_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow NULL avatar URLs
  IF NEW.avatar_url IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only allow URLs from our Supabase storage bucket
  IF NEW.avatar_url NOT LIKE '%/storage/v1/object/public/avatars/%'
     AND NEW.avatar_url NOT LIKE 'https://%.supabase.co/storage/%'
  THEN
    RAISE EXCEPTION 'Avatar URL must point to an approved storage location';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_avatar_url ON public.profiles;
CREATE TRIGGER trg_validate_avatar_url
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_avatar_url();
