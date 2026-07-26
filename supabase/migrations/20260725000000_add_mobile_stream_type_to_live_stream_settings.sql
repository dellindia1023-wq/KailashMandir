-- Add support for mobile stream type in live_stream_settings
ALTER TABLE public.live_stream_settings
DROP CONSTRAINT IF EXISTS live_stream_settings_stream_type_check;

ALTER TABLE public.live_stream_settings
ADD CONSTRAINT live_stream_settings_stream_type_check CHECK (stream_type IN ('hls', 'youtube', 'upload', 'mobile'));