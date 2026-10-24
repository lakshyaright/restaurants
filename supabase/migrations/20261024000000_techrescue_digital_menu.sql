-- ====================================================================
-- TechRescue Digital Menu SaaS — Complete Database Schema & Security
-- Migration: 20261024000000_techrescue_digital_menu.sql
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create PLATFORM_ADMINS table (Enforces secure server-side admin role)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create RESTAURANTS table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  address TEXT,
  phone TEXT,
  opening_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"22:00","closed":false},"tuesday":{"open":"09:00","close":"22:00","closed":false},"wednesday":{"open":"09:00","close":"22:00","closed":false},"thursday":{"open":"09:00","close":"22:00","closed":false},"friday":{"open":"09:00","close":"23:00","closed":false},"saturday":{"open":"09:00","close":"23:00","closed":false},"sunday":{"open":"09:00","close":"22:00","closed":false}}'::jsonb,
  currency TEXT NOT NULL DEFAULT 'INR',
  default_language TEXT NOT NULL DEFAULT 'en',
  dietary_preference TEXT NOT NULL DEFAULT 'all', -- 'all', 'pure_veg', 'veg_nonveg'
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'suspended')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create RESTAURANT_MEMBERS table (Tenant isolation & RBAC)
CREATE TABLE IF NOT EXISTS public.restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_restaurant_user UNIQUE (restaurant_id, user_id)
);

-- 6. Create CATEGORIES table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Create MENU_ITEMS table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  discounted_price NUMERIC(10, 2) CHECK (discounted_price IS NULL OR (discounted_price >= 0 AND discounted_price < price)),
  image_url TEXT,
  dietary_type TEXT NOT NULL DEFAULT 'veg' CHECK (dietary_type IN ('veg', 'non_veg', 'egg', 'vegan')),
  allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Helpful indexes for high-throughput queries
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON public.restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_user ON public.restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_restaurant ON public.restaurant_members(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.categories(restaurant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id, sort_order);

-- 9. Automatic Profile Creation on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Helper Security Functions (Avoid recursive RLS policies and ambiguous column references)
CREATE OR REPLACE FUNCTION public.is_admin(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_restaurant_member(check_restaurant_id UUID, req_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  IF req_role IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.restaurant_members rm
      WHERE rm.restaurant_id = check_restaurant_id
        AND rm.user_id = auth.uid()
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.restaurant_members rm
      WHERE rm.restaurant_id = check_restaurant_id
        AND rm.user_id = auth.uid()
        AND rm.role = req_role
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 11. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------
-- RLS POLICIES: PROFILES
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile or platform admins can view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or platform admins can view all"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- -------------------------------------------------------------------
-- RLS POLICIES: PLATFORM ADMINS
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin list" ON public.platform_admins;
CREATE POLICY "Admins can view admin list"
  ON public.platform_admins FOR SELECT
  USING (platform_admins.user_id = auth.uid() OR public.is_admin());

-- -------------------------------------------------------------------
-- RLS POLICIES: RESTAURANTS
-- -------------------------------------------------------------------
-- Public can view ONLY published restaurants
DROP POLICY IF EXISTS "Public can view published restaurants" ON public.restaurants;
CREATE POLICY "Public can view published restaurants"
  ON public.restaurants FOR SELECT
  USING (status = 'published');

-- Authorized members, creators, or platform admins can view their restaurants even if draft
DROP POLICY IF EXISTS "Members and admins can view their restaurants" ON public.restaurants;
CREATE POLICY "Members and admins can view their restaurants"
  ON public.restaurants FOR SELECT
  USING (created_by = auth.uid() OR public.is_restaurant_member(id) OR public.is_admin());

-- Authenticated users can create restaurants
DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON public.restaurants;
CREATE POLICY "Authenticated users can create restaurants"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Restaurant owners, creators, or platform admins can update
DROP POLICY IF EXISTS "Owners and admins can update restaurant" ON public.restaurants;
CREATE POLICY "Owners and admins can update restaurant"
  ON public.restaurants FOR UPDATE
  USING (created_by = auth.uid() OR public.is_restaurant_member(id, 'owner') OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_restaurant_member(id, 'owner') OR public.is_admin());

-- Restaurant owners or platform admins can delete
DROP POLICY IF EXISTS "Owners and admins can delete restaurant" ON public.restaurants;
CREATE POLICY "Owners and admins can delete restaurant"
  ON public.restaurants FOR DELETE
  USING (created_by = auth.uid() OR public.is_restaurant_member(id, 'owner') OR public.is_admin());

-- -------------------------------------------------------------------
-- RLS POLICIES: RESTAURANT MEMBERS
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view membership" ON public.restaurant_members;
CREATE POLICY "Members can view membership"
  ON public.restaurant_members FOR SELECT
  USING (restaurant_members.user_id = auth.uid() OR public.is_restaurant_member(restaurant_members.restaurant_id) OR public.is_admin());

DROP POLICY IF EXISTS "Owners can add members" ON public.restaurant_members;
CREATE POLICY "Owners can add members"
  ON public.restaurant_members FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_members.user_id = auth.uid()
    OR public.is_restaurant_member(restaurant_members.restaurant_id, 'owner')
    OR public.is_admin()
  );

CREATE POLICY "Owners can update members"
  ON public.restaurant_members FOR UPDATE
  USING (public.is_restaurant_member(restaurant_id, 'owner') OR public.is_admin());

CREATE POLICY "Owners can delete members"
  ON public.restaurant_members FOR DELETE
  USING (public.is_restaurant_member(restaurant_id, 'owner') OR public.is_admin());

-- -------------------------------------------------------------------
-- RLS POLICIES: CATEGORIES
-- -------------------------------------------------------------------
-- Public can view active categories of published restaurants
CREATE POLICY "Public can view active categories of published restaurants"
  ON public.categories FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = categories.restaurant_id AND r.status = 'published'
    )
  );

-- Restaurant members and platform admins can view all categories
CREATE POLICY "Members and admins can view all categories"
  ON public.categories FOR SELECT
  USING (public.is_restaurant_member(restaurant_id) OR public.is_admin());

-- Members can insert, update, delete
CREATE POLICY "Members and admins can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_restaurant_member(restaurant_id) OR public.is_admin());

CREATE POLICY "Members and admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_restaurant_member(restaurant_id) OR public.is_admin())
  WITH CHECK (public.is_restaurant_member(restaurant_id) OR public.is_admin());

CREATE POLICY "Members and admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_restaurant_member(restaurant_id) OR public.is_admin());

-- -------------------------------------------------------------------
-- RLS POLICIES: MENU ITEMS
-- -------------------------------------------------------------------
-- Public can view active menu items belonging to active categories of published restaurants
CREATE POLICY "Public can view active menu items of published restaurants"
  ON public.menu_items FOR SELECT
  USING (
    is_available = true AND
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_items.restaurant_id AND r.status = 'published'
    ) AND
    EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = menu_items.category_id AND c.is_active = true
    )
  );

-- Members and admins can view all menu items
CREATE POLICY "Members and admins can view all menu items"
  ON public.menu_items FOR SELECT
  USING (public.is_restaurant_member(restaurant_id) OR public.is_admin());

CREATE POLICY "Members and admins can insert menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.is_restaurant_member(restaurant_id) OR public.is_admin())
    -- Enforce that category belongs to the exact same restaurant!
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id AND c.restaurant_id = menu_items.restaurant_id
    )
  );

CREATE POLICY "Members and admins can update menu items"
  ON public.menu_items FOR UPDATE
  USING (public.is_restaurant_member(restaurant_id) OR public.is_admin())
  WITH CHECK (
    (public.is_restaurant_member(restaurant_id) OR public.is_admin())
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id AND c.restaurant_id = menu_items.restaurant_id
    )
  );

CREATE POLICY "Members and admins can delete menu items"
  ON public.menu_items FOR DELETE
  USING (public.is_restaurant_member(restaurant_id) OR public.is_admin());

-- -------------------------------------------------------------------
-- 12. Supabase Storage Setup (Buckets & Object Policies)
-- -------------------------------------------------------------------
-- Ensure public bucket 'restaurant-assets' exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-assets', 'restaurant-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS
CREATE POLICY "Public read access on restaurant-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-assets');

CREATE POLICY "Authenticated users can upload to restaurant-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'restaurant-assets');

CREATE POLICY "Authenticated users can update their restaurant assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'restaurant-assets');

CREATE POLICY "Authenticated users can delete their restaurant assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'restaurant-assets');
