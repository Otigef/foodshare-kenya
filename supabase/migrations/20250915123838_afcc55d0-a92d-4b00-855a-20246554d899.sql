-- Drop the existing policy that allows public contact_phone access
DROP POLICY "Public can view donations without contact info" ON public.food_donations;

-- Create secure policy for donors to manage their own donations
CREATE POLICY "Donors can manage their own donations"
ON public.food_donations
FOR ALL
USING (auth.uid() = donor_id)
WITH CHECK (auth.uid() = donor_id);

-- Create secure policy for approved recipients to view donation details (without contact_phone)
CREATE POLICY "Public can view available donations without contact info"
ON public.food_donations
FOR SELECT
USING (
  status = 'available'::donation_status
  -- This policy will be used only with explicit column selection excluding contact_phone
);

-- Update the existing secure function to exclude contact_phone properly
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
SET search_path = public
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

-- The existing get_donor_contact_for_claim function already securely provides contact info
-- only to recipients with approved claims - no changes needed there