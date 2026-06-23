
-- Create a SECURITY DEFINER function that can reassign super_admin
-- This function temporarily disables the trigger to allow the swap
CREATE OR REPLACE FUNCTION public.reassign_super_admin(new_super_admin_id uuid, old_super_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Disable the triggers temporarily
  ALTER TABLE public.user_roles DISABLE TRIGGER enforce_single_super_admin_trigger;
  ALTER TABLE public.user_roles DISABLE TRIGGER prevent_super_admin_deletion_trigger;

  -- Remove old super_admin role
  DELETE FROM public.user_roles WHERE user_id = old_super_admin_id AND role = 'super_admin';
  
  -- Give old super_admin the admin role if they don't have one
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = old_super_admin_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (old_super_admin_id, 'admin');
  END IF;

  -- Insert or update new super_admin
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = new_super_admin_id) THEN
    UPDATE public.user_roles SET role = 'super_admin' WHERE user_id = new_super_admin_id;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new_super_admin_id, 'super_admin');
  END IF;

  -- Re-enable triggers
  ALTER TABLE public.user_roles ENABLE TRIGGER enforce_single_super_admin_trigger;
  ALTER TABLE public.user_roles ENABLE TRIGGER prevent_super_admin_deletion_trigger;
END;
$$;

-- Restrict this function — only callable by service role (no RLS bypass needed since it's SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.reassign_super_admin(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reassign_super_admin(uuid, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.reassign_super_admin(uuid, uuid) FROM anon;
