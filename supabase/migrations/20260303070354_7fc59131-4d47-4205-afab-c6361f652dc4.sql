
-- Live stream settings table
CREATE TABLE public.live_stream_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_url TEXT NOT NULL DEFAULT '',
  is_live BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL DEFAULT 'Live Darshan',
  description TEXT DEFAULT 'Watch the live darshan from Kailash Mahadev Temple Agra',
  viewer_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.live_stream_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Anyone can view live stream settings"
ON public.live_stream_settings FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update live stream settings"
ON public.live_stream_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert live stream settings"
ON public.live_stream_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.live_stream_settings (stream_url, is_live, title, description)
VALUES ('', false, 'Live Darshan', 'Watch the live darshan from Kailash Mahadev Temple Agra');

-- Enable realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_settings;
