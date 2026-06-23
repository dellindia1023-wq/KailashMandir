-- Create aarti_schedule table for managing aarti timings
CREATE TABLE IF NOT EXISTS public.aarti_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT DEFAULT '',
  is_special BOOLEAN DEFAULT FALSE,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.aarti_schedule ENABLE ROW LEVEL SECURITY;

-- Public read access for everyone
CREATE POLICY "aarti_schedule_select_all" ON public.aarti_schedule
  FOR SELECT USING (TRUE);

-- Admin insert/update/delete
CREATE POLICY "aarti_schedule_insert_admin" ON public.aarti_schedule
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "aarti_schedule_update_admin" ON public.aarti_schedule
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "aarti_schedule_delete_admin" ON public.aarti_schedule
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insert default aarti timings
INSERT INTO public.aarti_schedule (name, start_time, end_time, description, is_special, "order")
VALUES
  ('Mangla Aarti', '04:00:00'::TIME, '04:30:00'::TIME, 'Early morning worship', TRUE, 1),
  ('Shringar Darshan', '05:00:00'::TIME, '06:30:00'::TIME, 'Preparation and decoration', FALSE, 2),
  ('Bhog Aarti', '07:30:00'::TIME, '08:00:00'::TIME, 'Mid-morning prayer', FALSE, 3),
  ('Raj Bhog Aarti', '12:00:00'::TIME, '12:30:00'::TIME, 'Afternoon blessed offering', FALSE, 4),
  ('Evening Darshan', '16:00:00'::TIME, '19:00:00'::TIME, 'Evening prayer and darshan', FALSE, 5),
  ('Sandhya Aarti', '19:30:00'::TIME, '20:00:00'::TIME, 'Twilight worship', TRUE, 6),
  ('Shayan Aarti', '21:00:00'::TIME, '21:30:00'::TIME, 'Night prayer before rest', FALSE, 7)
ON CONFLICT DO NOTHING;
