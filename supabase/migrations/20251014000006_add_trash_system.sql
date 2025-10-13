-- Add trash system for soft deletion with evidence preservation
-- Allows admins to move deleted items to trash before permanent deletion

-- Add deleted_at column to profiles for soft delete
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Create index on deleted_at for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON public.profiles(deleted_at);

-- Create trash table for deleted products (evidence preservation)
CREATE TABLE IF NOT EXISTS public.trash_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_email text,
  user_full_name text,
  title text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  condition text NOT NULL,
  is_negotiable boolean DEFAULT false,
  status text NOT NULL,
  province_id integer,
  regency_id integer,
  latitude numeric(10,8),
  longitude numeric(11,8),
  category_id integer,
  images jsonb, -- Store product images as JSON
  comments jsonb, -- Store comments as JSON for evidence
  created_at timestamp with time zone,
  deleted_at timestamp with time zone DEFAULT now(),
  deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deletion_reason text,
  CONSTRAINT trash_products_price_check CHECK (price >= 0)
);

-- Enable RLS on trash_products
ALTER TABLE public.trash_products ENABLE ROW LEVEL SECURITY;

-- Create index on trash_products
CREATE INDEX IF NOT EXISTS idx_trash_products_deleted_at ON public.trash_products(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_products_user ON public.trash_products(user_id);
CREATE INDEX IF NOT EXISTS idx_trash_products_deleted_by ON public.trash_products(deleted_by);

-- RLS policy: Only admins can view trash
CREATE POLICY "Admins can view trash"
ON public.trash_products
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS policy: Only admins can insert to trash
CREATE POLICY "Admins can insert to trash"
ON public.trash_products
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS policy: Only admins can delete from trash (permanent deletion)
CREATE POLICY "Admins can permanently delete trash"
ON public.trash_products
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Function to move user's products to trash
CREATE OR REPLACE FUNCTION public.move_user_products_to_trash(
  target_user_id uuid,
  admin_user_id uuid,
  reason text
)
RETURNS TABLE(moved_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  product_record RECORD;
  total_moved integer := 0;
  user_email_val text;
  user_name_val text;
BEGIN
  -- Verify admin permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_user_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Get user info
  SELECT u.email, p.full_name
  INTO user_email_val, user_name_val
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE u.id = target_user_id;

  -- Loop through all products of the user
  FOR product_record IN
    SELECT
      p.*,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'image_url', pi.image_url,
            'order', pi.order
          )
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'::jsonb
      ) as product_images,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', pc.id,
            'user_id', pc.user_id,
            'comment', pc.comment,
            'rating', pc.rating,
            'created_at', pc.created_at,
            'is_seller_reply', pc.is_seller_reply
          )
        ) FILTER (WHERE pc.id IS NOT NULL),
        '[]'::jsonb
      ) as product_comments
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    LEFT JOIN product_comments pc ON p.id = pc.product_id
    WHERE p.user_id = target_user_id
    GROUP BY p.id
  LOOP
    -- Insert to trash
    INSERT INTO trash_products (
      original_product_id,
      user_id,
      user_email,
      user_full_name,
      title,
      description,
      price,
      condition,
      is_negotiable,
      status,
      province_id,
      regency_id,
      latitude,
      longitude,
      category_id,
      images,
      comments,
      created_at,
      deleted_at,
      deleted_by,
      deletion_reason
    ) VALUES (
      product_record.id,
      product_record.user_id,
      user_email_val,
      user_name_val,
      product_record.title,
      product_record.description,
      product_record.price,
      product_record.condition,
      product_record.is_negotiable,
      product_record.status,
      product_record.province_id,
      product_record.regency_id,
      product_record.latitude,
      product_record.longitude,
      product_record.category_id,
      product_record.product_images,
      product_record.product_comments,
      product_record.created_at,
      now(),
      admin_user_id,
      reason
    );

    total_moved := total_moved + 1;
  END LOOP;

  RETURN QUERY SELECT total_moved;
END;
$function$;

-- Function to restore product from trash
CREATE OR REPLACE FUNCTION public.restore_product_from_trash(
  trash_id uuid,
  admin_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  trash_record RECORD;
  new_product_id uuid;
  image_item jsonb;
  comment_item jsonb;
BEGIN
  -- Verify admin permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_user_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Get trash record
  SELECT * INTO trash_record
  FROM trash_products
  WHERE id = trash_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trash record not found';
  END IF;

  -- Check if user still exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = trash_record.user_id) THEN
    RAISE EXCEPTION 'Cannot restore: User no longer exists';
  END IF;

  -- Restore product
  INSERT INTO products (
    user_id,
    title,
    description,
    price,
    condition,
    is_negotiable,
    status,
    province_id,
    regency_id,
    latitude,
    longitude,
    category_id,
    created_at,
    updated_at
  ) VALUES (
    trash_record.user_id,
    trash_record.title,
    trash_record.description,
    trash_record.price,
    trash_record.condition,
    trash_record.is_negotiable,
    'inactive', -- Restore as inactive for review
    trash_record.province_id,
    trash_record.regency_id,
    trash_record.latitude,
    trash_record.longitude,
    trash_record.category_id,
    trash_record.created_at,
    now()
  )
  RETURNING id INTO new_product_id;

  -- Restore images
  FOR image_item IN SELECT * FROM jsonb_array_elements(trash_record.images)
  LOOP
    INSERT INTO product_images (product_id, image_url, "order")
    VALUES (
      new_product_id,
      (image_item->>'image_url')::text,
      (image_item->>'order')::integer
    );
  END LOOP;

  -- Note: Comments are not restored, kept in trash for evidence only

  -- Delete from trash
  DELETE FROM trash_products WHERE id = trash_id;

  RETURN new_product_id;
END;
$function$;
