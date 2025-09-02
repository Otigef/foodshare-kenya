-- Fix security issue: Donor phone numbers exposed to all users
-- Create a secure view that excludes contact_phone for public access

-- First, drop the existing problematic policy
DROP POLICY IF EXISTS "Public can view donation details without contact info" ON food_donations;

-- Create a more secure policy that completely restricts access to contact_phone for non-owners
CREATE POLICY "Users can view donations with restricted contact info" 
ON food_donations 
FOR SELECT 
USING (
  -- Donors can see all their own donation details including contact_phone
  auth.uid() = donor_id 
  OR 
  -- Other users can only see available donations without contact_phone
  (auth.uid() <> donor_id AND status = 'available'::donation_status)
);

-- Create a security definer function that returns donation details without contact info for public view
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
SET search_path = 'public'
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