-- 4. DELETE - Remove the campaign
DELETE FROM public.campaigns 
WHERE id = 'fc6ead2c-7272-4d5b-9dbb-f61459082caf'
RETURNING id, name, slug;
