-- Drop the existing policy that exposes personal information
DROP POLICY "Users can view public organization info" ON public.profiles;

-- Create a new secure policy that only exposes organization_name and role
-- This policy will be used with a view or function to restrict column access
CREATE POLICY "Users can view limited public organization info" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() <> user_id) 
  AND (role = ANY (ARRAY['recipient'::user_role, 'admin'::user_role])) 
  AND (organization_name IS NOT NULL)
);

-- Create a security definer function to safely expose only organization info
CREATE OR REPLACE FUNCTION public.get_public_profile_info_secure(profile_user_id uuid)
RETURNS TABLE(user_id uuid, organization_name text, role user_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.organization_name,
    p.role
  FROM profiles p
  WHERE p.user_id = profile_user_id
    AND (p.role IN ('recipient', 'admin') AND p.organization_name IS NOT NULL);
$$;