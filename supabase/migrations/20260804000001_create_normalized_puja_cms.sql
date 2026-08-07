-- Create normalized Puja CMS tables and backfill legacy data
CREATE TABLE IF NOT EXISTS public.puja_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.puja_details (
  puja_id UUID PRIMARY KEY REFERENCES public.pujas(id) ON DELETE CASCADE,
  subtitle TEXT,
  slug TEXT UNIQUE,
  short_description TEXT,
  description TEXT,
  long_description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.puja_booking_settings (
  puja_id UUID PRIMARY KEY REFERENCES public.pujas(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_price NUMERIC(10,2) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  estimated_completion TEXT,
  booking_enabled BOOLEAN NOT NULL DEFAULT true,
  donation_enabled BOOLEAN NOT NULL DEFAULT true,
  online_puja BOOLEAN NOT NULL DEFAULT true,
  offline_puja BOOLEAN NOT NULL DEFAULT true,
  home_puja BOOLEAN NOT NULL DEFAULT false,
  temple_puja BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  popular BOOLEAN NOT NULL DEFAULT false,
  trending BOOLEAN NOT NULL DEFAULT false,
  recommended BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.puja_seo (
  puja_id UUID PRIMARY KEY REFERENCES public.pujas(id) ON DELETE CASCADE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.puja_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puja_id UUID NOT NULL REFERENCES public.pujas(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  role TEXT NOT NULL CHECK (role IN ('image', 'thumbnail', 'banner', 'icon', 'mobile_banner', 'desktop_banner')),
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (puja_id, role)
);

CREATE TABLE IF NOT EXISTS public.puja_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puja_id UUID NOT NULL REFERENCES public.pujas(id) ON DELETE CASCADE,
  benefit TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pujas ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.puja_categories(id);

INSERT INTO public.puja_categories (name, slug, created_at, updated_at)
SELECT DISTINCT
  COALESCE(NULLIF(TRIM(category), ''), 'general') AS name,
  LOWER(REGEXP_REPLACE(COALESCE(NULLIF(TRIM(category), ''), 'general'), '[^a-z0-9]+', '-', 'g')) AS slug,
  now(),
  now()
FROM public.pujas
ON CONFLICT (slug) DO NOTHING;

UPDATE public.pujas
SET category_id = pc.id
FROM public.puja_categories pc
WHERE LOWER(REGEXP_REPLACE(COALESCE(NULLIF(TRIM(public.pujas.category), ''), 'general'), '[^a-z0-9]+', '-', 'g')) = pc.slug;

INSERT INTO public.puja_details (puja_id, subtitle, slug, short_description, description, long_description, icon_url, created_at, updated_at)
SELECT
  id,
  subtitle,
  COALESCE(NULLIF(TRIM(slug), ''), LOWER(REGEXP_REPLACE(name, '[^a-z0-9]+', '-', 'g'))),
  COALESCE(short_description, description),
  description,
  COALESCE(long_description, description),
  NULL,
  created_at,
  now()
FROM public.pujas
WHERE NOT EXISTS (SELECT 1 FROM public.puja_details pd WHERE pd.puja_id = public.pujas.id);

INSERT INTO public.puja_booking_settings (
  puja_id,
  price,
  discount_price,
  duration_minutes,
  estimated_completion,
  booking_enabled,
  donation_enabled,
  online_puja,
  offline_puja,
  home_puja,
  temple_puja,
  featured,
  popular,
  trending,
  recommended,
  priority,
  sort_order,
  created_at,
  updated_at
)
SELECT
  id,
  price,
  COALESCE(discount_price, price),
  duration_minutes,
  estimated_completion,
  COALESCE(booking_enabled, true),
  COALESCE(donation_enabled, true),
  COALESCE(online_puja, true),
  COALESCE(offline_puja, true),
  COALESCE(home_puja, false),
  COALESCE(temple_puja, true),
  COALESCE(featured, false),
  COALESCE(popular, false),
  COALESCE(trending, false),
  COALESCE(recommended, false),
  COALESCE(priority, 0),
  COALESCE(sort_order, 0),
  created_at,
  now()
FROM public.pujas
WHERE NOT EXISTS (SELECT 1 FROM public.puja_booking_settings pbs WHERE pbs.puja_id = public.pujas.id);

INSERT INTO public.puja_seo (puja_id, seo_title, seo_description, seo_keywords, created_at, updated_at)
SELECT id, NULL, NULL, NULL, created_at, now() FROM public.pujas
WHERE NOT EXISTS (SELECT 1 FROM public.puja_seo ps WHERE ps.puja_id = public.pujas.id);

INSERT INTO public.puja_media (puja_id, media_type, role, url, is_primary, created_at, updated_at)
SELECT id, 'image', 'image', image_url, true, now(), now()
FROM public.pujas
WHERE image_url IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.puja_media pm WHERE pm.puja_id = public.pujas.id AND pm.role = 'image'
);

ALTER TABLE public.puja_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read puja categories"
  ON public.puja_categories FOR SELECT
  USING (true);

CREATE POLICY "Admin manage puja categories"
  ON public.puja_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read puja details"
  ON public.puja_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pujas p WHERE p.id = puja_details.puja_id AND p.is_active = true));

CREATE POLICY "Admin manage puja details"
  ON public.puja_details FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read puja booking settings"
  ON public.puja_booking_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pujas p WHERE p.id = puja_booking_settings.puja_id AND p.is_active = true));

CREATE POLICY "Admin manage puja booking settings"
  ON public.puja_booking_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read puja seo"
  ON public.puja_seo FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pujas p WHERE p.id = puja_seo.puja_id AND p.is_active = true));

CREATE POLICY "Admin manage puja seo"
  ON public.puja_seo FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read puja media"
  ON public.puja_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pujas p WHERE p.id = puja_media.puja_id AND p.is_active = true));

CREATE POLICY "Admin manage puja media"
  ON public.puja_media FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read puja benefits"
  ON public.puja_benefits FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pujas p WHERE p.id = puja_benefits.puja_id AND p.is_active = true));

CREATE POLICY "Admin manage puja benefits"
  ON public.puja_benefits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_puja_categories_updated_at
  BEFORE UPDATE ON public.puja_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_puja_details_updated_at
  BEFORE UPDATE ON public.puja_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_puja_booking_settings_updated_at
  BEFORE UPDATE ON public.puja_booking_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_puja_seo_updated_at
  BEFORE UPDATE ON public.puja_seo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_puja_media_updated_at
  BEFORE UPDATE ON public.puja_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_puja_benefits_updated_at
  BEFORE UPDATE ON public.puja_benefits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
