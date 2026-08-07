ALTER TABLE public.live_stream_settings
ADD COLUMN IF NOT EXISTS source_name TEXT NOT NULL DEFAULT 'Primary Camera',
ADD COLUMN IF NOT EXISTS backup_stream_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS source_notes TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS manual_override BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_live BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.live_stream_settings
SET source_name = COALESCE(source_name, 'Primary Camera'),
    backup_stream_url = COALESCE(backup_stream_url, ''),
    source_notes = COALESCE(source_notes, ''),
    manual_override = COALESCE(manual_override, FALSE),
    manual_live = COALESCE(manual_live, FALSE)
WHERE id IS NOT NULL;
