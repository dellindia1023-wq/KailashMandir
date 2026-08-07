-- Production MediaMTX and stream-management backend support
ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS media_server_url TEXT DEFAULT '';

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS media_server_path TEXT DEFAULT 'live';

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS rtmp_url TEXT DEFAULT '';

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS rtmp_stream_key TEXT DEFAULT 'live';

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS camera_username TEXT DEFAULT '';

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS camera_password TEXT DEFAULT '';

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS auto_failover BOOLEAN DEFAULT false;

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS recording_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS stream_status TEXT DEFAULT 'offline';

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS health_summary TEXT DEFAULT '';

ALTER TABLE public.live_stream_settings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.live_stream_settings
  DROP CONSTRAINT IF EXISTS live_stream_settings_stream_type_check;

ALTER TABLE public.live_stream_settings
  ADD CONSTRAINT live_stream_settings_stream_type_check CHECK (stream_type IN ('hls', 'youtube', 'upload', 'mobile', 'rtmp', 'rtsp', 'webrtc'));

ALTER TABLE public.live_stream_sources
  DROP CONSTRAINT IF EXISTS live_stream_sources_source_type_check;

ALTER TABLE public.live_stream_sources
  ADD CONSTRAINT live_stream_sources_source_type_check CHECK (source_type IN ('hls', 'youtube', 'upload', 'mobile', 'webrtc', 'vimeo', 'facebook', 'rtmp', 'scheduled', 'rtsp'));

ALTER TABLE public.live_stream_providers
  DROP CONSTRAINT IF EXISTS live_stream_providers_provider_type_check;

ALTER TABLE public.live_stream_providers
  ADD CONSTRAINT live_stream_providers_provider_type_check CHECK (provider_type IN ('cctv','hls','webrtc','youtube','vimeo','facebook','upload','scheduled','rtmp','rtsp'));

DROP POLICY IF EXISTS "Anyone can view live stream providers" ON public.live_stream_providers;
DROP POLICY IF EXISTS "Admins can manage live stream providers" ON public.live_stream_providers;
DROP POLICY IF EXISTS "Anyone can view live stream sources" ON public.live_stream_sources;
DROP POLICY IF EXISTS "Admins can manage live stream sources" ON public.live_stream_sources;
DROP POLICY IF EXISTS "Admins can view sessions" ON public.live_stream_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.live_stream_sessions;
DROP POLICY IF EXISTS "Admins can view live stream events" ON public.live_stream_events;
DROP POLICY IF EXISTS "Admins can manage live stream events" ON public.live_stream_events;
DROP POLICY IF EXISTS "Admins can view analytics" ON public.live_stream_analytics;
DROP POLICY IF EXISTS "Admins can manage analytics" ON public.live_stream_analytics;
DROP POLICY IF EXISTS "Admins can view permissions" ON public.live_stream_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.live_stream_permissions;

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
