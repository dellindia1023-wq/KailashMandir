-- Email notification preferences table
CREATE TABLE public.email_notification_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  booking_enabled BOOLEAN NOT NULL DEFAULT true,
  payment_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  system_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_notification_prefs ENABLE ROW LEVEL SECURITY;

-- Users can view own prefs
CREATE POLICY "Users can view own email prefs"
ON public.email_notification_prefs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can insert own prefs
CREATE POLICY "Users can insert own email prefs"
ON public.email_notification_prefs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own prefs
CREATE POLICY "Users can update own email prefs"
ON public.email_notification_prefs FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "Admins can read all email prefs"
ON public.email_notification_prefs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));