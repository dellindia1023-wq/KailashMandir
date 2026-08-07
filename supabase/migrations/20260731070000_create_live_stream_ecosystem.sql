-- Live stream ecosystem tables for multi-source, history, analytics, and permissions

CREATE TABLE IF NOT EXISTS public.live_stream_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('cctv','hls','webrtc','youtube','vimeo','facebook','upload','scheduled','rtmp')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  documentation_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_stream_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.live_stream_providers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  source_key TEXT NOT NULL UNIQUE,
  description TEXT,
  stream_url TEXT NOT NULL DEFAULT '',
  backup_stream_url TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL CHECK (source_type IN ('hls','youtube','upload','mobile','webrtc','vimeo','facebook','rtmp','scheduled')),
  current_status TEXT NOT NULL DEFAULT 'offline' CHECK (current_status IN ('offline','live','paused','error')),
  priority INTEGER NOT NULL DEFAULT 1,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.live_stream_sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  started_by UUID REFERENCES auth.users(id),
  stopped_by UUID REFERENCES auth.users(id),
  viewer_count INTEGER NOT NULL DEFAULT 0,
  peak_viewer_count INTEGER NOT NULL DEFAULT 0,
  average_watch_seconds INTEGER NOT NULL DEFAULT 0,
  recording_status TEXT NOT NULL DEFAULT 'none' CHECK (recording_status IN ('none','recording','recorded')),
  recording_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended','paused','failed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_stream_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.live_stream_sources(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.live_stream_sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('start','stop','pause','resume','switch','error','record_start','record_stop','manual_override','schedule_update')),
  event_description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_stream_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.live_stream_sources(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.live_stream_sessions(id) ON DELETE SET NULL,
  metric_date DATE NOT NULL,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  peak_viewer_count INTEGER NOT NULL DEFAULT 0,
  engagement_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, session_id, metric_date)
);

CREATE TABLE IF NOT EXISTS public.live_stream_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_start BOOLEAN NOT NULL DEFAULT false,
  can_stop BOOLEAN NOT NULL DEFAULT false,
  can_pause BOOLEAN NOT NULL DEFAULT false,
  can_switch BOOLEAN NOT NULL DEFAULT false,
  can_manage_cameras BOOLEAN NOT NULL DEFAULT false,
  can_manage_schedule BOOLEAN NOT NULL DEFAULT false,
  can_manage_providers BOOLEAN NOT NULL DEFAULT false,
  can_upload_video BOOLEAN NOT NULL DEFAULT false,
  can_override_manual BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Updates
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER live_stream_providers_set_updated_at
BEFORE UPDATE ON public.live_stream_providers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER live_stream_sources_set_updated_at
BEFORE UPDATE ON public.live_stream_sources
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER live_stream_sessions_set_updated_at
BEFORE UPDATE ON public.live_stream_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER live_stream_analytics_set_updated_at
BEFORE UPDATE ON public.live_stream_analytics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER live_stream_permissions_set_updated_at
BEFORE UPDATE ON public.live_stream_permissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.live_stream_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live stream providers"
  ON public.live_stream_providers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage live stream providers"
  ON public.live_stream_providers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone can view live stream sources"
  ON public.live_stream_sources FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage live stream sources"
  ON public.live_stream_sources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view sessions"
  ON public.live_stream_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage sessions"
  ON public.live_stream_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view live stream events"
  ON public.live_stream_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage live stream events"
  ON public.live_stream_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view analytics"
  ON public.live_stream_analytics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage analytics"
  ON public.live_stream_analytics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view permissions"
  ON public.live_stream_permissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage permissions"
  ON public.live_stream_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_providers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_permissions;
