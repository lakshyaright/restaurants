-- ====================================================================
-- TechRescue Digital Menu — Waiter Call & Table Service Requests
-- Migration: 20261024000002_waiter_calls.sql
-- ====================================================================

-- 1. Create WAITER_CALLS table
CREATE TABLE IF NOT EXISTS public.waiter_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'take_order',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'completed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for fast real-time queries
CREATE INDEX IF NOT EXISTS idx_waiter_calls_restaurant ON public.waiter_calls(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status ON public.waiter_calls(restaurant_id, status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Public customer can request waiter / service
DROP POLICY IF EXISTS "Public can insert waiter calls" ON public.waiter_calls;
CREATE POLICY "Public can insert waiter calls"
  ON public.waiter_calls FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can view recent waiter calls for their table feedback
DROP POLICY IF EXISTS "Public can view waiter calls" ON public.waiter_calls;
CREATE POLICY "Public can view waiter calls"
  ON public.waiter_calls FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restaurant owners and staff can update status (attending, completed, dismissed)
DROP POLICY IF EXISTS "Members can update waiter calls" ON public.waiter_calls;
CREATE POLICY "Members can update waiter calls"
  ON public.waiter_calls FOR UPDATE
  USING (
    public.is_restaurant_member(restaurant_id) OR
    public.is_admin()
  )
  WITH CHECK (true);

-- Restaurant members can delete calls
DROP POLICY IF EXISTS "Members can delete waiter calls" ON public.waiter_calls;
CREATE POLICY "Members can delete waiter calls"
  ON public.waiter_calls FOR DELETE
  USING (
    public.is_restaurant_member(restaurant_id) OR
    public.is_admin()
  );
