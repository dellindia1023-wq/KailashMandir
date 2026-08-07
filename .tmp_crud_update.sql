-- 3. UPDATE - Modify the campaign
UPDATE public.campaigns 
SET name = 'Updated Test Campaign CRUD',
    description = 'Updated description for CRUD test',
    status = 'running',
    priority = 100,
    updated_at = now()
WHERE id = 'fc6ead2c-7272-4d5b-9dbb-f61459082caf'
RETURNING id, name, slug, status, priority, updated_at;
