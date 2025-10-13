-- Allow admins to manage product images in storage bucket
-- This enables admin users to upload/update/delete images when editing other users' products

-- Drop existing storage policies for product-images bucket
DROP POLICY IF EXISTS "product_images_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_owner_or_admin_delete" ON storage.objects;

-- Recreate INSERT policy - allow all authenticated users (checked at app level)
CREATE POLICY "product_images_authenticated_insert"
ON storage.objects
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Recreate UPDATE policy - allow all authenticated users
CREATE POLICY "product_images_authenticated_update"
ON storage.objects
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Recreate DELETE policy - allow owner OR admin
CREATE POLICY "product_images_owner_or_admin_delete"
ON storage.objects
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    auth.uid() = owner
    OR EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
);
