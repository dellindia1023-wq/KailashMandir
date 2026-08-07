INSERT INTO public.campaigns (name, slug, description, type, status, priority, is_active, locations, targeting_rules, content, ctas, analytics)
VALUES (
  'FINAL_CRUD_' || extract(epoch FROM now())::text,
  'final-crud-' || to_char(now(), 'YYYYMMDDHHmmss'),
  'Test campaign for complete CRUD verification',
  'Test',
  'draft',
  50,
  true,
  jsonb_build_array('homepage.hero'),
  jsonb_build_object('page_types', jsonb_build_array('home'), 'logged_in', 'any'),
  jsonb_build_object('headline', 'Test', 'message', 'CRUD Test'),
  jsonb_build_array(jsonb_build_object('id', 'cta-1', 'label', 'Learn', 'url', '/', 'type', 'link')),
  jsonb_build_object('impressions', 0, 'clicks', 0)
)
RETURNING id, name, slug, status, priority;
