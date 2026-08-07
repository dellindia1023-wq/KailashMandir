INSERT INTO public.campaigns (
  name, slug, description, type, status, priority, is_active, 
  locations, targeting_rules, content, ctas, analytics
)
VALUES (
  'CRUD_Test_' || to_char(NOW(), 'HH24:MI:SS'),
  'crud-test-' || to_char(NOW(), 'YYYYMMDDHH24MISS'),
  'CRUD Test Campaign',
  'Test',
  'draft',
  50,
  true,
  jsonb_build_array('homepage.hero'),
  jsonb_build_object('page_types', jsonb_build_array('home'), 'logged_in', 'any'),
  jsonb_build_object('headline', 'CRUD Test', 'message', 'Test Message'),
  jsonb_build_array(jsonb_build_object('id', 'cta-1', 'label', 'Learn', 'url', '/', 'type', 'link')),
  jsonb_build_object('impressions', 0, 'clicks', 0)
)
RETURNING id, name, slug, status;
