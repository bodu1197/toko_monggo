-- Generate slugs for existing products
-- This function creates SEO-friendly slugs from product titles

CREATE OR REPLACE FUNCTION generate_slug_from_title(title text, product_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  slug text;
  short_id text;
BEGIN
  -- Get first 8 characters of UUID
  short_id := substring(product_id::text, 1, 8);

  -- Generate slug from title
  slug := lower(trim(title));

  -- Replace special characters
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');

  -- Replace spaces with hyphens
  slug := regexp_replace(slug, '\s+', '-', 'g');

  -- Replace multiple hyphens with single hyphen
  slug := regexp_replace(slug, '-+', '-', 'g');

  -- Remove leading/trailing hyphens
  slug := regexp_replace(slug, '^-+|-+$', '', 'g');

  -- Limit to 60 characters
  IF length(slug) > 60 THEN
    slug := substring(slug, 1, 60);
    slug := regexp_replace(slug, '-[^-]*$', '');
  END IF;

  -- Add short ID for uniqueness
  slug := slug || '-' || short_id;

  RETURN slug;
END;
$$;

-- Update existing products with generated slugs
UPDATE public.products
SET slug = generate_slug_from_title(title, id)
WHERE slug IS NULL;

-- Drop the temporary function
DROP FUNCTION IF EXISTS generate_slug_from_title(text, uuid);

-- Make slug NOT NULL after populating
ALTER TABLE public.products
ALTER COLUMN slug SET NOT NULL;
