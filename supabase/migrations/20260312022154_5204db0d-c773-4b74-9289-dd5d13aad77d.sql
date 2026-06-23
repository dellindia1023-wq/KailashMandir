
-- 2. Create get_user_role function (single call, replaces sequential has_role calls)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles
     WHERE user_id = _user_id
     ORDER BY CASE role
       WHEN 'super_admin' THEN 1
       WHEN 'admin' THEN 2
       WHEN 'priest' THEN 3
       WHEN 'moderator' THEN 4
       WHEN 'user' THEN 5
     END
     LIMIT 1),
    'user'
  )
$$;

-- 3. Update has_role so super_admin automatically satisfies admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'super_admin' AND _role = 'admin')
      )
  )
$$;
