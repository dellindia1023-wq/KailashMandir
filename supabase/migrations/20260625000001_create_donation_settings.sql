CREATE TABLE IF NOT EXISTS public.donation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_amount NUMERIC(10,2) NOT NULL DEFAULT 251,
  minimum_amount NUMERIC(10,2) NOT NULL DEFAULT 1,
  maximum_amount NUMERIC(10,2) NOT NULL DEFAULT 500000,
  suggested_amounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  enable_suggested_amounts BOOLEAN NOT NULL DEFAULT true,
  enable_custom_amount BOOLEAN NOT NULL DEFAULT true,
  enable_razorpay BOOLEAN NOT NULL DEFAULT true,
  enable_quick_upi BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view donation settings"
  ON public.donation_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage donation settings"
  ON public.donation_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
  );

CREATE OR REPLACE FUNCTION public.set_donation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER donation_settings_set_updated_at
BEFORE UPDATE ON public.donation_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_donation_settings_updated_at();
