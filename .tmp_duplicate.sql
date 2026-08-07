INSERT INTO public.campaigns (name, slug, description, type, status, priority, is_active, locations, targeting_rules, content, ctas, analytics)
SELECT name || ' (duplicate)', slug || '-dup-' || to_char(now(), 'YYYYMMDDHH24MISS'), description, type, 'draft', priority, false, locations, targeting_rules, content, ctas, jsonb_build_object('impressions',0,'clicks',0,'conversions',0)
FROM public.campaigns
WHERE id = '6c5d7cde-ff61-453d-99c1-9b844c896667'
RETURNING id, name, slug, status, priority, created_at;
