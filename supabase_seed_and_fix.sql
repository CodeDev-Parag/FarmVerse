-- ============================================================
-- FarmVerse: Fix RLS + Seed Approved Dummy Products
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- STEP 1: Ensure the approval_status column exists with the right default
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

-- Update any existing rows that have NULL approval_status to 'approved'
UPDATE public.products 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- STEP 2: Fix RLS policies on products table
-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Allow admin to update products" ON public.products;
DROP POLICY IF EXISTS "Allow farmers to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public to read approved products" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;

-- Enable RLS on products (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can READ all products (marketplace needs this)
CREATE POLICY "Allow public read" ON public.products
  FOR SELECT USING (true);

-- Policy 2: Authenticated farmers can INSERT their own products
CREATE POLICY "Allow farmers to insert" ON public.products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Allow authenticated users to UPDATE any product
-- (This covers admin updating approval_status)
-- For production, scope this to admin role only
CREATE POLICY "Allow authenticated update" ON public.products
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 4: Allow authenticated users to DELETE (admin only in prod)
CREATE POLICY "Allow authenticated delete" ON public.products
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- STEP 3: Insert approved dummy farmer products
-- These will immediately appear on the marketplace
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

-- STEP 4: Verify the data
SELECT id, name, price, approval_status, created_at 
FROM public.products 
ORDER BY created_at DESC 
LIMIT 20;
