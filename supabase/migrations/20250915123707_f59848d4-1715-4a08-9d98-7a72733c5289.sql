-- Remove the remaining public SELECT policy that still exposed full rows
DROP POLICY IF EXISTS "Users can view limited public organization info" ON public.profiles;

-- Security helper to identify admins without causing RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Allow admins to view all profiles fully (required for admin UI)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_current_user_role() = 'admin'::public.user_role);

-- Note: Public/org viewers must use the secure function instead of table select
--   get_public_profile_info_secure(profile_user_id uuid) returns only (user_id, organization_name, role)