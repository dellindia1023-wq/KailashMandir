
CREATE TABLE public.darshan_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  label text DEFAULT 'Darshan',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.darshan_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active darshan schedule"
  ON public.darshan_schedule FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage darshan schedule"
  ON public.darshan_schedule FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_darshan_schedule_updated_at
  BEFORE UPDATE ON public.darshan_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
