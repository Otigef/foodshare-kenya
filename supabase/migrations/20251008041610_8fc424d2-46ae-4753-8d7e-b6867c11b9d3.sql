-- Create audit table for role changes
CREATE TABLE IF NOT EXISTS public.role_changes_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  old_role app_role,
  new_role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on audit table
ALTER TABLE public.role_changes_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.role_changes_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_role_audit_admin ON public.role_changes_audit(admin_id);
CREATE INDEX idx_role_audit_target ON public.role_changes_audit(target_user_id);
CREATE INDEX idx_role_audit_created ON public.role_changes_audit(created_at DESC);

-- Create secure RPC function for role management
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_role app_role;
  result jsonb;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  
  -- Prevent self-demotion from admin role
  IF target_user_id = auth.uid() THEN
    SELECT role INTO current_role 
    FROM user_roles 
    WHERE user_id = target_user_id 
    LIMIT 1;
    
    IF current_role = 'admin' AND new_role != 'admin' THEN
      RAISE EXCEPTION 'Cannot remove your own admin privileges';
    END IF;
  END IF;
  
  -- Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get current role for audit log
  SELECT role INTO current_role 
  FROM user_roles 
  WHERE user_id = target_user_id 
  LIMIT 1;
  
  -- Log the change
  INSERT INTO role_changes_audit (admin_id, target_user_id, old_role, new_role)
  VALUES (auth.uid(), target_user_id, current_role, new_role);
  
  -- Update role in user_roles table
  DELETE FROM user_roles WHERE user_id = target_user_id;
  INSERT INTO user_roles (user_id, role) VALUES (target_user_id, new_role);
  
  -- Update profile table for backward compatibility
  UPDATE profiles 
  SET role = new_role::text::user_role,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Return success with audit info
  result := jsonb_build_object(
    'success', true,
    'old_role', current_role,
    'new_role', new_role,
    'changed_by', auth.uid(),
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.admin_update_user_role IS 'Securely update user roles with admin verification, self-demotion prevention, and audit logging';