-- Function to count admins
CREATE OR REPLACE FUNCTION public.count_admins()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer 
  FROM public.user_roles 
  WHERE role = 'admin';
$$;

-- Function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  );
$$;

-- Function to get all users with roles (superadmin only)
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin_management()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  organization_name text,
  phone text,
  location text,
  role app_role,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only superadmin can access this
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: superadmin access required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.organization_name,
    p.phone,
    p.location,
    COALESCE(ur.role, 'donor'::app_role) as role,
    p.created_at
  FROM profiles p
  LEFT JOIN user_roles ur ON p.user_id = ur.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to promote user to admin (superadmin only)
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_role app_role;
  admin_count integer;
  result jsonb;
BEGIN
  -- Verify caller is superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: superadmin access required';
  END IF;
  
  -- Prevent self-promotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify your own role';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get current role
  SELECT role INTO current_role 
  FROM user_roles 
  WHERE user_id = target_user_id 
  LIMIT 1;
  
  -- Prevent modifying superadmin
  IF current_role = 'superadmin' THEN
    RAISE EXCEPTION 'Cannot modify superadmin role';
  END IF;
  
  -- Check if already admin
  IF current_role = 'admin' THEN
    RAISE EXCEPTION 'User is already an admin';
  END IF;
  
  -- Enforce max 5 admins rule
  SELECT count_admins() INTO admin_count;
  IF admin_count >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 admins allowed. Please remove an admin first.';
  END IF;
  
  -- Log the change
  INSERT INTO role_changes_audit (admin_id, target_user_id, old_role, new_role)
  VALUES (auth.uid(), target_user_id, current_role, 'admin');
  
  -- Update role in user_roles table
  DELETE FROM user_roles WHERE user_id = target_user_id;
  INSERT INTO user_roles (user_id, role) VALUES (target_user_id, 'admin');
  
  -- Update profile table for compatibility
  UPDATE profiles 
  SET role = 'admin'::user_role,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Return success
  result := jsonb_build_object(
    'success', true,
    'old_role', current_role,
    'new_role', 'admin',
    'admin_count', admin_count + 1,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;

-- Function to remove admin role (superadmin only)
CREATE OR REPLACE FUNCTION public.remove_admin(target_user_id uuid, new_role app_role DEFAULT 'donor')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_role app_role;
  result jsonb;
BEGIN
  -- Verify caller is superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: superadmin access required';
  END IF;
  
  -- Prevent self-demotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify your own role';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get current role
  SELECT role INTO current_role 
  FROM user_roles 
  WHERE user_id = target_user_id 
  LIMIT 1;
  
  -- Prevent demoting superadmin
  IF current_role = 'superadmin' THEN
    RAISE EXCEPTION 'Cannot demote superadmin';
  END IF;
  
  -- Check if currently admin
  IF current_role != 'admin' THEN
    RAISE EXCEPTION 'User is not an admin';
  END IF;
  
  -- Validate new_role (only allow donor or recipient)
  IF new_role NOT IN ('donor', 'recipient') THEN
    RAISE EXCEPTION 'Invalid role. Can only demote to donor or recipient.';
  END IF;
  
  -- Log the change
  INSERT INTO role_changes_audit (admin_id, target_user_id, old_role, new_role)
  VALUES (auth.uid(), target_user_id, current_role, new_role);
  
  -- Update role in user_roles table
  DELETE FROM user_roles WHERE user_id = target_user_id;
  INSERT INTO user_roles (user_id, role) VALUES (target_user_id, new_role);
  
  -- Update profile table for compatibility
  UPDATE profiles 
  SET role = new_role::text::user_role,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Return success
  result := jsonb_build_object(
    'success', true,
    'old_role', 'admin',
    'new_role', new_role,
    'admin_count', count_admins(),
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;

-- Function to get admin stats (for dashboard)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only admin or superadmin can access
  IF NOT has_role(auth.uid(), 'admin') AND NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  
  result := jsonb_build_object(
    'admin_count', count_admins(),
    'max_admins', 5,
    'is_superadmin', is_superadmin(auth.uid())
  );
  
  RETURN result;
END;
$$;