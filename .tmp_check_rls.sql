-- Check RLS policies on campaigns table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'campaigns'
ORDER BY policyname;
