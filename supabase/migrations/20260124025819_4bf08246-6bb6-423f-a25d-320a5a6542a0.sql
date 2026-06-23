-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pujas table (reference data for available pujas)
CREATE TABLE public.pujas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorite pujas table
CREATE TABLE public.favorite_pujas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puja_id UUID NOT NULL REFERENCES public.pujas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, puja_id)
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  tier TEXT NOT NULL DEFAULT 'seva',
  transaction_id TEXT,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pujas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_pujas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Pujas policies (public read for all)
CREATE POLICY "Anyone can view active pujas" 
  ON public.pujas FOR SELECT 
  USING (is_active = true);

-- Favorite pujas policies
CREATE POLICY "Users can view their favorite pujas" 
  ON public.favorite_pujas FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite pujas" 
  ON public.favorite_pujas FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorite pujas" 
  ON public.favorite_pujas FOR DELETE 
  USING (auth.uid() = user_id);

-- Donations policies
CREATE POLICY "Users can view their own donations" 
  ON public.donations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own donations" 
  ON public.donations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger for profile timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample pujas data
INSERT INTO public.pujas (name, description, price, duration_minutes, category) VALUES
  ('Rudrabhishek', 'Sacred abhishekam with milk, honey, and holy water', 1101, 90, 'abhishekam'),
  ('Laghu Rudra', 'Condensed Rudra puja with 11 recitations of Rudram', 2501, 120, 'abhishekam'),
  ('Maha Mrityunjaya Jaap', '108 recitations of the life-giving mantra', 501, 60, 'jaap'),
  ('Shiv Chalisa Path', 'Complete recitation of Shiv Chalisa', 251, 30, 'path'),
  ('Bilvarchan Puja', 'Offering 108 bilva leaves to Lord Shiva', 751, 45, 'puja'),
  ('Shravan Somvar Puja', 'Special Monday puja during Shravan month', 1501, 120, 'special'),
  ('Maha Shivaratri Puja', 'All-night vigil and puja on Shivaratri', 5001, 480, 'special'),
  ('Daily Aarti Sponsorship', 'Sponsor the daily morning and evening aarti', 351, 30, 'sponsorship');