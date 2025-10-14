-- Add 'paused' status to products.status CHECK constraint
-- This allows products to be temporarily paused by sellers

-- Drop the existing CHECK constraint
ALTER TABLE "public"."products" DROP CONSTRAINT IF EXISTS "products_status_check";

-- Add the new CHECK constraint with 'paused' included
ALTER TABLE "public"."products"
ADD CONSTRAINT "products_status_check"
CHECK (
  ((status)::text = ANY (
    (ARRAY[
      'active'::character varying,
      'paused'::character varying,
      'sold'::character varying,
      'inactive'::character varying,
      'deleted'::character varying,
      'suspended'::character varying
    ])::text[]
  ))
);
