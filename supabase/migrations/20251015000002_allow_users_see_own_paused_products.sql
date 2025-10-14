-- Allow users to see their own products regardless of status
-- This enables My Page to show paused products to the owner

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Products are viewable by everyone or admins" ON "public"."products";

-- Create new SELECT policy that allows:
-- 1. Everyone to see active and sold products
-- 2. Product owners to see their own products (any status)
-- 3. Admins to see all products
CREATE POLICY "Products viewable by everyone, owners, or admins"
ON "public"."products"
AS PERMISSIVE
FOR SELECT
TO public
USING (
  ((status)::text = ANY ((ARRAY['active'::character varying, 'sold'::character varying])::text[]))
  OR (auth.uid() = user_id)
  OR is_admin()
);
