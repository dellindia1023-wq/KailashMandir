-- Migration: Add RPC functions for admin/super_admin role management
-- Purpose: Allow flexible role assignment and admin account creation

-- Function to safely create super_admin role (only one allowed)
CREATE OR REPLACE FUNCTION public.create_or_update_super_admin(_user_id UUID, _email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSON;
  v_existing_super_admin UUID;
BEGIN
  -- Check if super_admin already exists for a different user
  SELECT user_id INTO v_existing_super_admin
  FROM public.user_roles
  WHERE role = 'super_admin' AND user_id != _user_id;
  
  IF v_existing_super_admin IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only one Super Admin is allowed. Existing Super Admin found.',
      'existing_super_admin_id', v_existing_super_admin
    );
  END IF;
  
  -- Remove super_admin role from all other users
  DELETE FROM public.user_roles
  WHERE role = 'super_admin' AND user_id != _user_id;
  
  -- Assign super_admin role to the specified user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'super_admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile email if needed
  UPDATE public.profiles
  SET user_email = _email
  WHERE user_id = _user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Super Admin role assigned successfully',
    'user_id', _user_id,
    'email', _email
  );
END;
$$;

-- Function to assign admin role to existing user
CREATE OR REPLACE FUNCTION public.assign_admin_role(_user_id UUID, _email TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile email if provided
  IF _email IS NOT NULL THEN
    UPDATE public.profiles
    SET user_email = _email
    WHERE user_id = _user_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Admin role assigned successfully',
    'user_id', _user_id,
    'email', _email
  );
END;
$$;

-- Function to get all admins and super_admins
CREATE OR REPLACE FUNCTION public.get_admins()
RETURNS TABLE(user_id UUID, email TEXT, role TEXT, full_name TEXT, created_at TIMESTAMP)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.user_id,
    p.user_email,
    ur.role::text,
    p.full_name,
    ur.created_at
  FROM public.user_roles ur
  JOIN public.profiles p ON ur.user_id = p.user_id
  WHERE ur.role IN ('admin', 'super_admin')
  ORDER BY ur.role, ur.created_at;
END;
$$;
