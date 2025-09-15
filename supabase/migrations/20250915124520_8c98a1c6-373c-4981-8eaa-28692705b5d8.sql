-- Drop the current SELECT policy that still exposes contact_phone
DROP POLICY "Public can view available donations without contact info" ON public.food_donations;

-- Create a view for public donation access without contact_phone
CREATE OR REPLACE VIEW public.public_donations AS
SELECT 
  id,
  donor_id,
  title,
  description,
  food_type,
  quantity,
  pickup_location,
  expiry_time,
  status,
  special_instructions,
  created_at,
  updated_at
FROM public.food_donations
WHERE status = 'available'::donation_status;

-- Enable RLS on the view
ALTER VIEW public.public_donations SET (security_barrier = true);

-- Create policy for the view (public access without contact_phone)
CREATE POLICY "Public can view donations via view"
ON public.food_donations
FOR SELECT
USING (false); -- Deny direct table access for non-owners

-- Update the public donations function to use explicit column selection
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
    id,
    donor_id,
    title,
    description,
    food_type,
    quantity,
    pickup_location,
    expiry_time,
    status,
    special_instructions,
    created_at,
    updated_at
  FROM public_donations;
$$;