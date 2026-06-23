
-- 1. Trigger to enforce only ONE super_admin role in the system
CREATE OR REPLACE FUNCTION public.enforce_single_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- On INSERT: block if another super_admin already exists
  IF TG_OP = 'INSERT' AND NEW.role = 'super_admin' THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
      RAISE EXCEPTION 'Only one Super Admin is allowed in the system.';
    END IF;
  END IF;

  -- On UPDATE: block if changing TO super_admin and one already exists (for a different user)
  IF TG_OP = 'UPDATE' AND NEW.role = 'super_admin' AND OLD.role != 'super_admin' THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
      RAISE EXCEPTION 'Only one Super Admin is allowed in the system.';
    END IF;
  END IF;

  -- Prevent changing super_admin role to something else
  IF TG_OP = 'UPDATE' AND OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
    RAISE EXCEPTION 'The Super Admin role cannot be downgraded or reassigned.';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS enforce_single_super_admin_trigger ON public.user_roles;

CREATE TRIGGER enforce_single_super_admin_trigger
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_super_admin();

-- 2. Prevent deletion of super_admin role
CREATE OR REPLACE FUNCTION public.prevent_super_admin_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role = 'super_admin' THEN
    RAISE EXCEPTION 'The Super Admin role cannot be deleted.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_super_admin_deletion_trigger ON public.user_roles;

CREATE TRIGGER prevent_super_admin_deletion_trigger
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_super_admin_deletion();
