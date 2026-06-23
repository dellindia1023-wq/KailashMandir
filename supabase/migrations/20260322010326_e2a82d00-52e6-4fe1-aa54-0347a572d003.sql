
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: System can insert notifications (via service role / triggers)
CREATE POLICY "Authenticated users can receive notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Updated_at trigger
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.notify_on_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _puja_name TEXT;
  _admin_ids UUID[];
BEGIN
  -- Get puja name
  SELECT name INTO _puja_name FROM public.pujas WHERE id = NEW.puja_id;

  -- Get all admin user IDs
  SELECT ARRAY_AGG(user_id) INTO _admin_ids
  FROM public.user_roles WHERE role IN ('admin', 'super_admin');

  -- On INSERT: booking created
  IF TG_OP = 'INSERT' THEN
    -- Notify user (confirmation)
    INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
    VALUES (NEW.user_id, 'user', 'Booking Confirmed',
      'Your booking for ' || COALESCE(_puja_name, 'Puja') || ' on ' || NEW.booking_date || ' has been created.',
      'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.created'));

    -- Notify admins
    IF _admin_ids IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
      SELECT unnest(_admin_ids), 'admin', 'New Booking Received',
        NEW.devotee_name || ' booked ' || COALESCE(_puja_name, 'Puja') || ' for ' || NEW.booking_date,
        'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.created');
    END IF;

    RETURN NEW;
  END IF;

  -- On UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Priest assigned
    IF NEW.assigned_priest_id IS DISTINCT FROM OLD.assigned_priest_id AND NEW.assigned_priest_id IS NOT NULL THEN
      -- Notify priest
      INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
      VALUES (NEW.assigned_priest_id, 'priest', 'New Puja Assignment',
        'You have been assigned ' || COALESCE(_puja_name, 'Puja') || ' on ' || NEW.booking_date || ' at ' || NEW.booking_time,
        'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.assigned'));

      -- Notify user
      INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
      VALUES (NEW.user_id, 'user', 'Priest Assigned',
        'A priest has been assigned for your ' || COALESCE(_puja_name, 'Puja') || ' booking.',
        'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.assigned'));
    END IF;

    -- Booking status changed
    IF NEW.booking_status IS DISTINCT FROM OLD.booking_status THEN
      IF NEW.booking_status = 'approved' THEN
        INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
        VALUES (NEW.user_id, 'user', 'Booking Approved',
          'Your booking for ' || COALESCE(_puja_name, 'Puja') || ' on ' || NEW.booking_date || ' has been approved.',
          'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.approved'));
      ELSIF NEW.booking_status = 'rejected' THEN
        INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
        VALUES (NEW.user_id, 'user', 'Booking Rejected',
          'Your booking for ' || COALESCE(_puja_name, 'Puja') || ' on ' || NEW.booking_date || ' has been rejected.',
          'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.rejected'));
      ELSIF NEW.booking_status = 'completed' THEN
        -- Notify user
        INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
        VALUES (NEW.user_id, 'user', 'Puja Completed',
          'Your ' || COALESCE(_puja_name, 'Puja') || ' has been completed. Thank you for your devotion!',
          'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.completed'));
        -- Notify priest
        IF NEW.assigned_priest_id IS NOT NULL THEN
          INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
          VALUES (NEW.assigned_priest_id, 'priest', 'Puja Completed',
            COALESCE(_puja_name, 'Puja') || ' for ' || NEW.devotee_name || ' has been marked as completed.',
            'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.completed'));
        END IF;
        -- Notify admins
        IF _admin_ids IS NOT NULL THEN
          INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
          SELECT unnest(_admin_ids), 'admin', 'Booking Completed',
            COALESCE(_puja_name, 'Puja') || ' for ' || NEW.devotee_name || ' has been completed.',
            'booking', jsonb_build_object('booking_id', NEW.id, 'event', 'booking.completed');
        END IF;
      END IF;
    END IF;

    -- Payment completed
    IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
      INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
      VALUES (NEW.user_id, 'user', 'Payment Successful',
        'Payment of ₹' || NEW.amount || ' for ' || COALESCE(_puja_name, 'Puja') || ' has been received.',
        'payment', jsonb_build_object('booking_id', NEW.id, 'event', 'payment.completed', 'amount', NEW.amount));
      -- Notify admins
      IF _admin_ids IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, role, title, message, type, metadata)
        SELECT unnest(_admin_ids), 'admin', 'Payment Received',
          '₹' || NEW.amount || ' received from ' || NEW.devotee_name || ' for ' || COALESCE(_puja_name, 'Puja'),
          'payment', jsonb_build_object('booking_id', NEW.id, 'event', 'payment.completed', 'amount', NEW.amount);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on puja_bookings
CREATE TRIGGER notify_booking_changes
  AFTER INSERT OR UPDATE ON public.puja_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_booking_change();

-- Create index for fast lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
