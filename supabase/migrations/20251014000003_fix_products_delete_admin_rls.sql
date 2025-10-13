-- Allow admins to delete any product
-- This enables admin users to delete other users' products from admin panel

-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

-- Recreate DELETE policy with admin support
CREATE POLICY "Users and admins can delete products"
ON public.products
AS PERMISSIVE
FOR DELETE
TO public
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
