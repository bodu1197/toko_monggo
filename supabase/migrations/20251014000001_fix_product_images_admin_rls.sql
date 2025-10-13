-- Allow admins to insert/delete product images for any product
-- This enables admin users to add/remove images when editing other users' products

-- Drop existing policies
DROP POLICY IF EXISTS "Product owners can delete images" ON public.product_images;
DROP POLICY IF EXISTS "Product owners can insert images" ON public.product_images;
DROP POLICY IF EXISTS "Product owners and admins can delete images" ON public.product_images;
DROP POLICY IF EXISTS "Product owners and admins can insert images" ON public.product_images;
DROP POLICY IF EXISTS "Product owners and admins can update images" ON public.product_images;

-- Recreate DELETE policy with admin support
CREATE POLICY "Product owners and admins can delete images"
ON public.product_images
AS PERMISSIVE
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM products p
    LEFT JOIN profiles pr ON pr.id = auth.uid()
    WHERE p.id = product_images.product_id
      AND (p.user_id = auth.uid() OR pr.role = 'admin')
  )
);

-- Recreate INSERT policy with admin support
CREATE POLICY "Product owners and admins can insert images"
ON public.product_images
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM products p
    LEFT JOIN profiles pr ON pr.id = auth.uid()
    WHERE p.id = product_images.product_id
      AND (p.user_id = auth.uid() OR pr.role = 'admin')
  )
);

-- Add UPDATE policy for product_images (was missing!)
CREATE POLICY "Product owners and admins can update images"
ON public.product_images
AS PERMISSIVE
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM products p
    LEFT JOIN profiles pr ON pr.id = auth.uid()
    WHERE p.id = product_images.product_id
      AND (p.user_id = auth.uid() OR pr.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM products p
    LEFT JOIN profiles pr ON pr.id = auth.uid()
    WHERE p.id = product_images.product_id
      AND (p.user_id = auth.uid() OR pr.role = 'admin')
  )
);
