-- Fix security issue: Restrict profile visibility to protect personal information

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view public profile info of others" ON public.profiles;

-- Create a more restrictive policy that only allows viewing limited public information
-- Users can only see organization names of recipients/charities, not personal details
CREATE POLICY "Users can view limited public profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() <> user_id 
  AND role IN ('recipient', 'admin') 
  AND organization_name IS NOT NULL
);

-- Update the public profile info function to be more restrictive
-- Only return organization name and role for recipients/charities
-- Remove full_name from public access to protect privacy
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
RETURNS TABLE(user_id uuid, organization_name text, role user_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.user_id,
    CASE 
      WHEN p.role IN ('recipient', 'admin') AND p.organization_name IS NOT NULL 
      THEN p.organization_name
      ELSE NULL
    END as organization_name,
    p.role
  FROM profiles p
  WHERE p.user_id = profile_user_id
    AND (p.role IN ('recipient', 'admin') AND p.organization_name IS NOT NULL);
$function$;

-- Add a comment to document the security consideration
COMMENT ON FUNCTION public.get_public_profile_info(uuid) IS 'Returns limited public profile information. Only shows organization names for recipients/charities to protect user privacy.';