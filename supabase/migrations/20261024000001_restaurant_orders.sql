-- ====================================================================
-- TechRescue Digital Menu — Live Table Orders & Kitchen Dashboard
-- Migration: 20261024000001_restaurant_orders.sql
-- ====================================================================

-- 1. Create ORDERS table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  table_number TEXT NOT NULL,
  customer_name TEXT,
  notes TEXT,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'served', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create ORDER_ITEMS table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for fast real-time order queries
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------
-- RLS POLICIES: ORDERS
-- -------------------------------------------------------------------
-- Public can place orders for restaurants
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can view recent orders
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restaurant owners and staff can update order status (preparing, served, completed)
DROP POLICY IF EXISTS "Members can update orders" ON public.orders;
CREATE POLICY "Members can update orders"
  ON public.orders FOR UPDATE
  USING (
    public.is_restaurant_member(restaurant_id) OR
    public.is_admin()
  )
  WITH CHECK (true);

-- Restaurant members can delete orders
DROP POLICY IF EXISTS "Members can delete orders" ON public.orders;
CREATE POLICY "Members can delete orders"
  ON public.orders FOR DELETE
  USING (
    public.is_restaurant_member(restaurant_id) OR
    public.is_admin()
  );

-- -------------------------------------------------------------------
-- RLS POLICIES: ORDER_ITEMS
-- -------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items"
  ON public.order_items FOR SELECT
  TO anon, authenticated
  USING (true);
