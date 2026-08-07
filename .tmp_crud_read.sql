-- 2. READ - Fetch the campaign back
SELECT id, name, slug, status, priority, is_active, type, 
       locations, targeting_rules, content, ctas, analytics, 
       created_at, updated_at
FROM public.campaigns 
WHERE id = 'fc6ead2c-7272-4d5b-9dbb-f61459082caf';
