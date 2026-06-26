CREATE OR REPLACE FUNCTION public.complete_donation_payment(
  p_donation_id uuid,
  p_user_id uuid,
  p_payment_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.donations
  SET status = 'completed',
      transaction_id = p_payment_id
  WHERE id = p_donation_id
    AND user_id = p_user_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_donation_payment(
  p_donation_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.donations
  SET status = 'failed'
  WHERE id = p_donation_id
    AND user_id = p_user_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_booking_payment(
  p_booking_id uuid,
  p_user_id uuid,
  p_payment_id text,
  p_order_id text,
  p_signature text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.puja_bookings
  SET payment_id = p_payment_id,
      razorpay_order_id = p_order_id,
      razorpay_signature = p_signature,
      payment_status = 'paid',
      updated_at = now()
  WHERE id = p_booking_id
    AND user_id = p_user_id
    AND payment_status = 'pending';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_booking_payment(
  p_booking_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.puja_bookings
  SET payment_status = 'failed',
      updated_at = now()
  WHERE id = p_booking_id
    AND user_id = p_user_id
    AND payment_status = 'pending';

  RETURN FOUND;
END;
$$;
