
-- =============================================
-- NOTICE BOARD TABLE
-- =============================================
CREATE TYPE public.notice_priority AS ENUM ('normal', 'important', 'urgent');

CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority notice_priority NOT NULL DEFAULT 'normal',
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Anyone can view active, non-expired notices
CREATE POLICY "Anyone can view active notices"
ON public.notices FOR SELECT
USING (is_active = true AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE));

-- Admins can view all notices (including inactive/expired)
CREATE POLICY "Admins can view all notices"
ON public.notices FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create notices
CREATE POLICY "Admins can create notices"
ON public.notices FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update notices
CREATE POLICY "Admins can update notices"
ON public.notices FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete notices
CREATE POLICY "Admins can delete notices"
ON public.notices FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_notices_updated_at
BEFORE UPDATE ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- EVENTS TABLE (Dynamic, Admin-Managed)
-- =============================================
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT DEFAULT 'Kailash Mandir, Agra',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can view active events
CREATE POLICY "Anyone can view active events"
ON public.events FOR SELECT
USING (is_active = true);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create events
CREATE POLICY "Admins can create events"
ON public.events FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update events
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete events
CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUDIT LOG TABLE
-- =============================================
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  module_name TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert audit logs (system writes)
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
