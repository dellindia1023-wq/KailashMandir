
CREATE TABLE public.push_notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  booking_enabled boolean NOT NULL DEFAULT true,
  payment_enabled boolean NOT NULL DEFAULT true,
  reminder_enabled boolean NOT NULL DEFAULT true,
  system_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.push_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push prefs"
  ON public.push_notification_prefs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push prefs"
  ON public.push_notification_prefs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push prefs"
  ON public.push_notification_prefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all push prefs"
  ON public.push_notification_prefs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
