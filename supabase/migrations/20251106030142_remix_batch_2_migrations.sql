
-- Migration: 20251105235400
-- Create enum for restaurant types
CREATE TYPE public.restaurant_type AS ENUM (
  'casual_dining',
  'fine_dining',
  'fast_food',
  'cafe',
  'bar',
  'food_truck',
  'other'
);

-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM (
  'demo',
  'basic',
  'professional',
  'enterprise'
);

-- Create profiles table for restaurant information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  restaurant_type restaurant_type DEFAULT 'casual_dining',
  estimated_tables INTEGER DEFAULT 10,
  subscription_plan subscription_plan DEFAULT 'demo',
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create tables table for managing restaurant tables
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  table_number TEXT NOT NULL,
  qr_code_data TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, table_number)
);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tables
CREATE POLICY "Users can view their own tables"
  ON public.tables
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tables"
  ON public.tables
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tables"
  ON public.tables
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tables"
  ON public.tables
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_items
CREATE POLICY "Users can view their own menu items"
  ON public.menu_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own menu items"
  ON public.menu_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own menu items"
  ON public.menu_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own menu items"
  ON public.menu_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public access for menu items (so customers can view via QR code without auth)
CREATE POLICY "Anyone can view available menu items"
  ON public.menu_items
  FOR SELECT
  USING (is_available = true);

-- Create calls table for waiter calls
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'attended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Users can view their own calls"
  ON public.calls
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert calls"
  ON public.calls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calls"
  ON public.calls
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for calls table
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, restaurant_name, owner_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'restaurant_name', 'Meu Restaurante'),
    COALESCE(NEW.raw_user_meta_data->>'owner_name', 'Proprietário')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251106021710
-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true);

-- Create policies for menu images bucket
CREATE POLICY "Anyone can view menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own menu images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own menu images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images' 
  AND auth.role() = 'authenticated'
);
