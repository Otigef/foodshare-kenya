-- Create a trigger function that deletes donations when marked as expired
CREATE OR REPLACE FUNCTION public.delete_expired_donations()
RETURNS TRIGGER AS $$
BEGIN
  -- If the status is being changed to 'expired', delete the record
  IF NEW.status = 'expired'::donation_status THEN
    -- Delete related claims first (foreign key constraint)
    DELETE FROM public.donation_claims WHERE donation_id = NEW.id;
    -- Return NULL to prevent the update and delete the row instead
    DELETE FROM public.food_donations WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  
  -- For all other status changes, proceed normally
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create the trigger that fires before any update on food_donations
CREATE TRIGGER auto_delete_expired_donations
  BEFORE UPDATE ON public.food_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_expired_donations();