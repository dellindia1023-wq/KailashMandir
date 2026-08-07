INSERT INTO public.campaigns (
  name, slug, description, type, status, priority, start_date, end_date,
  is_active, locations, targeting_rules, content, ctas, analytics
) VALUES (
  'FINAL CRUD Test ' || to_char(now(), 'HH24:MI:SS'),
  'final-crud-' || to_char(now(), 'YYYYMMDDHH24MISS'),
  'Test campaign for final CRUD verification',
  'Test Type',
  'draft',
  50,
  now(),
  now() + interval '7 days',
  true,
  '[\"homepage.hero\"]'::jsonb,
  json_build_object('page_types', ARRAY['home'], 'logged_in', 'any', 'device', 'any')::jsonb,
  json_build_object('headline', 'Test Campaign', 'message', 'CRUD Test Message')::jsonb,
  json_build_array(json_build_object('id', 'cta-1', 'label', 'Learn More', 'url', '/', 'type', 'link'))::jsonb,
  json_build_object('impressions', 0, 'clicks', 0, 'conversions', 0)::jsonb
) RETURNING id, name, slug, status, priority, created_at;
