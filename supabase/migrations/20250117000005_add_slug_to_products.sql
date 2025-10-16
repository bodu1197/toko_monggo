-- Add slug column to products table for SEO-friendly URLs
ALTER TABLE public.products
ADD COLUMN slug text UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX idx_products_slug ON public.products(slug);

-- Add constraint to ensure slug format (lowercase, hyphens, alphanumeric)
ALTER TABLE public.products
ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Comment
COMMENT ON COLUMN public.products.slug IS 'SEO-friendly URL slug generated from title';
