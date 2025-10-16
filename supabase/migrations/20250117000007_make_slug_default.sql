-- Make slug nullable temporarily to allow existing code to work
-- Then we'll update the app code to generate slug properly

ALTER TABLE public.products
ALTER COLUMN slug DROP NOT NULL;

-- Add a default value for slug (temporary placeholder)
ALTER TABLE public.products
ALTER COLUMN slug SET DEFAULT 'pending-slug';

-- Update any null slugs to use the default
UPDATE public.products
SET slug = 'pending-slug-' || id::text
WHERE slug IS NULL OR slug = 'temp-slug';
