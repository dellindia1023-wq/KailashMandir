-- Verify campaign was deleted
SELECT COUNT(*) as campaign_count
FROM public.campaigns 
WHERE id = 'fc6ead2c-7272-4d5b-9dbb-f61459082caf';
