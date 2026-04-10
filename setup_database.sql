-- TN28 Fashion Store - Database Setup SQL
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/orzhjgrjpxrlikswwenc/sql)

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  price NUMERIC,
  "originalPrice" NUMERIC,
  stock INTEGER,
  fabric TEXT,
  image TEXT,
  sizes TEXT[],
  colors TEXT[],
  description TEXT,
  "isNew" BOOLEAN DEFAULT false,
  "isSale" BOOLEAN DEFAULT false,
  "isHot" BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 4.5,
  reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id TEXT UNIQUE,
  customer JSONB,
  address JSONB,
  items JSONB,
  total NUMERIC,
  "grandTotal" NUMERIC,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Profiles Table (for Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS (Row Level Security) and Public Access
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public All" ON public.products FOR ALL USING (true); -- Note: Secure this for production!

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Select Orders" ON public.orders FOR SELECT USING (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
