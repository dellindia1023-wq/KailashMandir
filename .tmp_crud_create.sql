-- Test Campaign CRUD Operations
-- 1. CREATE - Insert a test campaign
INSERT INTO public.campaigns (
  id, name, slug, description, type, status, priority, 
  is_active, locations, targeting_rules, content, ctas, 
  analytics, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Test Campaign CRUD',
  'test-campaign-crud-' || to_char(now(), 'YYYYMMDDHH24MISS'),
  'Test campaign for CRUD verification',
  'Test',
  'draft',
  50,
  true,
  '["homepage.hero", "sticky.header"]',
  '{"page_types": ["home"], "logged_in": "any", "device": "any"}',
  '{"headline": "Test Headline", "message": "Test Message", "image_url": "", "mobile_image_url": "", "background_color": "#ffffff", "badge": ""}',
  '[{"id": "cta-1", "label": "Learn More", "url": "/", "type": "link", "icon": "", "open_new_tab": false, "is_popup": false}]',
  '{"impressions": 0, "clicks": 0, "conversions": 0, "donation_amount": 0, "booking_count": 0}',
  now(),
  now()
) RETURNING id, name, slug, status, created_at;
