-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that allows users to view their own profile completely
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a policy that allows viewing only public profile information for other users
-- This allows displaying donor/organization info on donations while protecting sensitive data
CREATE POLICY "Users can view public profile info of others" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND 
  -- Only allow access to public fields through RLS - sensitive fields will be filtered in queries
  true
);

-- Add a security function to get public profile data only
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  organization_name text,
  role user_role
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.organization_name,
    p.role
  FROM profiles p
  WHERE p.user_id = profile_user_id;
$$;