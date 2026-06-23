-- Migration: Add missing columns to saved_kundlis for production astrology schema
-- Date: 2026-06-20 (patch)

ALTER TABLE public.saved_kundlis
ADD COLUMN IF NOT EXISTS lagna VARCHAR(100),
ADD COLUMN IF NOT EXISTS rashi VARCHAR(100),
ADD COLUMN IF NOT EXISTS nakshatra VARCHAR(100),
ADD COLUMN IF NOT EXISTS planets JSONB,
ADD COLUMN IF NOT EXISTS mangal_dosha JSONB,
ADD COLUMN IF NOT EXISTS kal_sarp_dosha JSONB,
ADD COLUMN IF NOT EXISTS sadhesati JSONB,
ADD COLUMN IF NOT EXISTS current_mahadasha VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_antardasha VARCHAR(100),
ADD COLUMN IF NOT EXISTS personality TEXT,
ADD COLUMN IF NOT EXISTS career TEXT,
ADD COLUMN IF NOT EXISTS marriage TEXT,
ADD COLUMN IF NOT EXISTS health TEXT,
ADD COLUMN IF NOT EXISTS remedies JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS recommended_pujas JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS lucky_gems JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS lucky_numbers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS lucky_colors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS raw_response JSONB,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_with JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'prokerala',
ADD COLUMN IF NOT EXISTS birth_latitude FLOAT,
ADD COLUMN IF NOT EXISTS birth_longitude FLOAT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kundli_shared ON public.saved_kundlis(is_shared);
CREATE INDEX IF NOT EXISTS idx_kundli_user ON public.saved_kundlis(user_id);
CREATE INDEX IF NOT EXISTS idx_kundli_date ON public.saved_kundlis(created_at);
