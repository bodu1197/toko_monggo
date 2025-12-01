-- =============================================
-- SECURITY RLS POLICIES FOR TOKO MONGGO
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =============================================
-- PRODUCTS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Users can create own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
TO public
USING (status = 'active' OR user_id = auth.uid());

-- Authenticated users can create products
CREATE POLICY "Users can create own products"
ON products FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update only their own products
CREATE POLICY "Users can update own products"
ON products FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete only their own products
CREATE POLICY "Users can delete own products"
ON products FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins can update any product
CREATE POLICY "Admins can update all products"
ON products FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can delete any product
CREATE POLICY "Admins can delete all products"
ON products FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================
-- PRODUCT_IMAGES TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Users can manage own product images" ON product_images;

-- Anyone can view product images
CREATE POLICY "Anyone can view product images"
ON product_images FOR SELECT
TO public
USING (true);

-- Users can manage images of their own products
CREATE POLICY "Users can manage own product images"
ON product_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_images.product_id
    AND products.user_id = auth.uid()
  )
);

-- Admins can manage all product images
CREATE POLICY "Admins can manage all product images"
ON product_images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================
-- SECURE ADMIN FUNCTIONS
-- =============================================

-- Drop existing function if any
DROP FUNCTION IF EXISTS get_all_users_with_email();

-- Secure function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users_with_email()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  is_suspended BOOLEAN
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Return user data
  RETURN QUERY
  SELECT
    p.id,
    u.email,
    p.full_name,
    p.role,
    p.created_at,
    COALESCE(p.is_suspended, false) as is_suspended
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_with_email() TO authenticated;

-- =============================================
-- AUDIT LOG TABLE (Optional but recommended)
-- =============================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON admin_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs"
ON admin_audit_log FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());

-- =============================================
-- VERIFICATION
-- =============================================

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'profiles', 'product_images');
