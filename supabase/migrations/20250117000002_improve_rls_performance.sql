-- Improve RLS policies performance by adding more specific indexes and optimizing policies

-- Create function to check if user owns product (for better performance)
CREATE OR REPLACE FUNCTION public.user_owns_product(product_id uuid, user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id AND products.user_id = user_id
    LIMIT 1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Create function to check if user is active (not suspended)
CREATE OR REPLACE FUNCTION public.is_user_active(user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND (is_suspended IS FALSE OR is_suspended IS NULL)
    AND deleted_at IS NULL
    LIMIT 1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_owns_product(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_active(uuid) TO authenticated;

-- Optimize products RLS policies
DROP POLICY IF EXISTS "Products viewable by everyone, owners, or admins" ON products;
CREATE POLICY "Products viewable by everyone, owners, or admins" ON products
FOR SELECT USING (
  -- Active/sold products visible to all
  (status IN ('active', 'sold') AND expires_at > NOW())
  -- Owner can see all their products
  OR (auth.uid() = user_id)
  -- Admins can see all products
  OR public.is_admin()
);

-- Optimize product images policies
DROP POLICY IF EXISTS "Product owners and admins can delete images" ON product_images;
CREATE POLICY "Product owners and admins can delete images" ON product_images
FOR DELETE USING (
  public.user_owns_product(product_id, auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Product owners and admins can insert images" ON product_images;
CREATE POLICY "Product owners and admins can insert images" ON product_images
FOR INSERT WITH CHECK (
  public.user_owns_product(product_id, auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Product owners and admins can update images" ON product_images;
CREATE POLICY "Product owners and admins can update images" ON product_images
FOR UPDATE USING (
  public.user_owns_product(product_id, auth.uid())
  OR public.is_admin()
);

-- Add policy for suspended users (prevent them from creating new content)
CREATE POLICY "Suspended users cannot insert products" ON products
FOR INSERT WITH CHECK (
  public.is_user_active(auth.uid())
);

CREATE POLICY "Suspended users cannot insert comments" ON product_comments
FOR INSERT WITH CHECK (
  public.is_user_active(auth.uid())
);

-- Create indexes to support RLS policies
CREATE INDEX IF NOT EXISTS idx_products_user_id_status_expires
ON products(user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_profiles_id_suspended_deleted
ON profiles(id, is_suspended, deleted_at);

-- Create materialized view for active product counts (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_active_product_counts AS
SELECT
  user_id,
  COUNT(*) as active_count,
  MAX(created_at) as last_product_date
FROM products
WHERE status = 'active'
  AND expires_at > NOW()
GROUP BY user_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_active_products_user
ON mv_active_product_counts(user_id);

-- Create function to refresh materialized view (can be called from cron job)
CREATE OR REPLACE FUNCTION public.refresh_active_product_counts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_product_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.refresh_active_product_counts() TO service_role;