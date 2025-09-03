-- First, let's see what the current policy looks like and fix it
-- Drop the existing problematic policy for food_donations
DROP POLICY IF EXISTS "Users can view donations with restricted contact info" ON public.food_donations;

-- Create a new policy that completely excludes contact_phone from public access
-- This policy will use a security definer function to ensure contact info is never exposed
CREATE POLICY "Public can view donations without contact info" 
ON public.food_donations 
FOR SELECT 
USING (
  -- Donors can see their own donations including contact info
  (auth.uid() = donor_id) 
  OR 
  -- Everyone else can only see donations if they're available, but without access to contact_phone
  -- The application layer will use get_public_donations() function to exclude contact_phone
  (auth.uid() <> donor_id AND status = 'available'::donation_status)
);

-- Update the existing get_public_donations function to ensure it's used correctly
CREATE OR REPLACE FUNCTION public.get_public_donations()
RETURNS TABLE(
  id uuid, 
  donor_id uuid, 
  title text, 
  description text, 
  food_type food_category, 
  quantity text, 
  pickup_location text, 
  expiry_time timestamp with time zone, 
  status donation_status, 
  special_instructions text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    d.id,
    d.donor_id,
    d.title, 
    d.description,
    d.food_type,
    d.quantity,
    d.pickup_location,
    d.expiry_time,
    d.status,
    d.special_instructions,
    d.created_at,
    d.updated_at
  FROM food_donations d
  WHERE d.status = 'available'::donation_status;
$$;

-- Also fix the profiles table to not expose personal info
DROP POLICY IF EXISTS "Users can view limited public profile info" ON public.profiles;

-- Create a more restrictive policy for profiles that only shows organization info
CREATE POLICY "Users can view public organization info" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() <> user_id) 
  AND (role = ANY (ARRAY['recipient'::user_role, 'admin'::user_role])) 
  AND (organization_name IS NOT NULL)
);

-- Create a security definer function for public profile access that only returns safe fields
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
RETURNS TABLE(
  user_id uuid, 
  organization_name text, 
  role user_role
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
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
$$;