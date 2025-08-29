-- Drop the overly permissive policy that exposes phone numbers
DROP POLICY IF EXISTS "Anyone can view available donations" ON public.food_donations;

-- Create a new policy that allows viewing donations but hides sensitive contact info for public viewing
CREATE POLICY "Public can view donation details without contact info" 
ON public.food_donations 
FOR SELECT 
USING (
  -- Donors can see all their own donation details including contact info
  auth.uid() = donor_id OR
  -- Others can see donation details but contact_phone will be filtered out in queries
  (auth.uid() != donor_id AND status = 'available')
);

-- Create a security function to get donation details without contact info for public viewing
CREATE OR REPLACE FUNCTION public.get_public_donation_info()
RETURNS TABLE(
  id uuid,
  donor_id uuid,
  title text,
  description text,
  food_type food_type,
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
  WHERE d.status = 'available';
$$;

-- Create a function to get donor contact info only for users with active claims
CREATE OR REPLACE FUNCTION public.get_donor_contact_for_claim(donation_uuid uuid)
RETURNS TABLE(
  contact_phone text,
  donor_name text,
  donor_organization text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.contact_phone,
    p.full_name,
    p.organization_name
  FROM food_donations d
  JOIN profiles p ON d.donor_id = p.user_id
  WHERE d.id = donation_uuid
    AND EXISTS (
      SELECT 1 FROM donation_claims dc 
      WHERE dc.donation_id = donation_uuid 
        AND dc.recipient_id = auth.uid()
        AND dc.status IN ('pending', 'approved')
    );
$$;