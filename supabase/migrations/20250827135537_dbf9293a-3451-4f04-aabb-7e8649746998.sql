-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('donor', 'recipient', 'admin');

-- Create enum for food categories
CREATE TYPE public.food_category AS ENUM ('fruits', 'vegetables', 'grains', 'dairy', 'meat', 'prepared', 'baked', 'other');

-- Create enum for donation status
CREATE TYPE public.donation_status AS ENUM ('available', 'claimed', 'completed', 'expired');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  role user_role NOT NULL DEFAULT 'donor',
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create food donations table
CREATE TABLE public.food_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  food_type food_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity TEXT NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE,
  pickup_location TEXT NOT NULL,
  contact_phone TEXT,
  special_instructions TEXT,
  status donation_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donation claims table
CREATE TABLE public.donation_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES public.food_donations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(donation_id, recipient_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_claims ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for food donations
CREATE POLICY "Anyone can view available donations" 
ON public.food_donations 
FOR SELECT 
USING (true);

CREATE POLICY "Donors can create donations" 
ON public.food_donations 
FOR INSERT 
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update their own donations" 
ON public.food_donations 
FOR UPDATE 
USING (auth.uid() = donor_id);

CREATE POLICY "Donors can delete their own donations" 
ON public.food_donations 
FOR DELETE 
USING (auth.uid() = donor_id);

-- Create RLS policies for donation claims
CREATE POLICY "Users can view claims for their donations or their own claims" 
ON public.donation_claims 
FOR SELECT 
USING (
  auth.uid() = recipient_id OR 
  auth.uid() IN (
    SELECT donor_id FROM public.food_donations WHERE id = donation_id
  )
);

CREATE POLICY "Recipients can create claims" 
ON public.donation_claims 
FOR INSERT 
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Recipients can update their own claims" 
ON public.donation_claims 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_donations_updated_at
  BEFORE UPDATE ON public.food_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donation_claims_updated_at
  BEFORE UPDATE ON public.donation_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'donor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();