-- Remove redundant SECURITY DEFINER view and functions
-- These are no longer needed since food_donations table now has proper RLS policies

-- Drop the public_donations view
DROP VIEW IF EXISTS public.public_donations CASCADE;

-- Drop the redundant get_public_donations function
DROP FUNCTION IF EXISTS public.get_public_donations() CASCADE;

-- Drop the redundant get_public_donation_info function
DROP FUNCTION IF EXISTS public.get_public_donation_info() CASCADE;

-- Drop the redundant get_public_profile_info_secure function (we have get_public_profile_info)
DROP FUNCTION IF EXISTS public.get_public_profile_info_secure(uuid) CASCADE;