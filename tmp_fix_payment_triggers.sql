CREATE OR REPLACE FUNCTION public.protect_booking_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

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

CREATE OR REPLACE FUNCTION public.protect_donation_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR has_role(auth.uid(), 'admin') THEN
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
