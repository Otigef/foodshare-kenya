-- Fix RLS policy on food_donations to allow proper access
-- Remove the overly restrictive policy and replace with proper policies

-- Drop the blocking policy
DROP POLICY IF EXISTS "Public can view donations via view" ON public.food_donations;

-- Add proper public read access for available donations
CREATE POLICY "Anyone can view available donations"
ON public.food_donations
FOR SELECT
USING (status = 'available');

-- Add admin access policy
CREATE POLICY "Admins can manage all donations"
ON public.food_donations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add input validation for donations
CREATE OR REPLACE FUNCTION validate_donation_input()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate title length
  IF length(trim(NEW.title)) < 3 OR length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Title must be between 3 and 200 characters';
  END IF;
  
  -- Validate quantity
  IF length(trim(NEW.quantity)) < 1 OR length(NEW.quantity) > 100 THEN
    RAISE EXCEPTION 'Quantity must be between 1 and 100 characters';
  END IF;
  
  -- Validate pickup location
  IF length(trim(NEW.pickup_location)) < 5 OR length(NEW.pickup_location) > 500 THEN
    RAISE EXCEPTION 'Pickup location must be between 5 and 500 characters';
  END IF;
  
  -- Validate phone if provided
  IF NEW.contact_phone IS NOT NULL AND length(NEW.contact_phone) > 50 THEN
    RAISE EXCEPTION 'Contact phone must be less than 50 characters';
  END IF;
  
  -- Validate expiry time if provided
  IF NEW.expiry_time IS NOT NULL AND NEW.expiry_time < now() THEN
    RAISE EXCEPTION 'Expiry time cannot be in the past';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_donation_before_insert ON public.food_donations;
CREATE TRIGGER validate_donation_before_insert
BEFORE INSERT OR UPDATE ON public.food_donations
FOR EACH ROW
EXECUTE FUNCTION validate_donation_input();