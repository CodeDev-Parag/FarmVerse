-- ============================================================
-- FarmVerse: Fix RLS + Seed Approved Dummy Products
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- STEP 1: Fix PRODUCTS table RLS
-- ============================================================

-- Ensure the approval_status column exists with the right default
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

-- Update any existing rows that have NULL approval_status to 'approved'
UPDATE public.products 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- Drop old/conflicting policies
DROP POLICY IF EXISTS "Allow admin to update products" ON public.products;
DROP POLICY IF EXISTS "Allow farmers to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public to read approved products" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "Allow public read" ON public.products;
DROP POLICY IF EXISTS "Allow farmers to insert" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.products;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone (including anon) can READ all products
CREATE POLICY "Allow public read" ON public.products
  FOR SELECT USING (true);

-- Policy 2: Authenticated users can INSERT
CREATE POLICY "Allow authenticated insert" ON public.products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Authenticated users can UPDATE (covers admin approval)
CREATE POLICY "Allow authenticated update" ON public.products
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 4: Authenticated users can DELETE
CREATE POLICY "Allow authenticated delete" ON public.products
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- STEP 2: Fix ORDERS table RLS
-- (THIS IS THE MAIN FIX FOR ORDER PLACEMENT FAILING)
-- ============================================================

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting existing policies
DROP POLICY IF EXISTS "Allow customers to insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow customers to read own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin to read all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin to update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated update orders" ON public.orders;

-- Policy 1: Any authenticated user can INSERT an order (place an order)
-- This fixes the "error placing order" bug
CREATE POLICY "Allow authenticated insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Users can read their own orders; admin reads all
CREATE POLICY "Allow read own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_id 
    OR auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'admin@farmverse.com'
    )
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'farmer'
    )
  );

-- Policy 3: Authenticated users can UPDATE orders (admin changes status, farmer views)
CREATE POLICY "Allow authenticated update orders" ON public.orders
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- STEP 3: Fix MESSAGES table RLS (for support chat)
-- ============================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated update messages" ON public.messages;

CREATE POLICY "Allow authenticated read messages" ON public.messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update messages" ON public.messages
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- STEP 4: Seed approved dummy products for the marketplace
-- ============================================================

INSERT INTO public.products (name, price, stock, image, category, unit, rating, reviews, "isFresh", approval_status, farmer_id)
VALUES
  (
    'Fresh Alphonso Mangoes',
    349,
    80,
    'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=80',
    'Fruits',
    'kg',
    4.8,
    212,
    true,
    'approved',
    NULL
  ),
  (
    'Organic Spinach',
    55,
    150,
    'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80',
    'Leafy Greens',
    'bunch',
    4.6,
    88,
    true,
    'approved',
    NULL
  ),
  (
    'Country Eggs (Desi)',
    180,
    200,
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80',
    'Dairy',
    'dozen',
    4.9,
    430,
    true,
    'approved',
    NULL
  ),
  (
    'Red Bell Peppers',
    140,
    60,
    'https://images.unsplash.com/photo-1568584711271-6c31c4f87c22?w=600&q=80',
    'Vegetables',
    'kg',
    4.5,
    67,
    true,
    'approved',
    NULL
  ),
  (
    'Watermelon',
    80,
    30,
    'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=600&q=80',
    'Fruits',
    'piece',
    4.7,
    159,
    true,
    'approved',
    NULL
  ),
  (
    'Pure Cow Ghee',
    650,
    40,
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
    'Dairy',
    '500ml',
    4.9,
    311,
    false,
    'approved',
    NULL
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 5: Verify everything
-- ============================================================

-- Check products
SELECT id, name, price, approval_status FROM public.products ORDER BY created_at DESC LIMIT 10;

-- Check orders RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('orders', 'products', 'messages')
ORDER BY tablename, policyname;
