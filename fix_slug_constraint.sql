-- ============================================================================
-- Fix slug NOT NULL constraint issue
-- ============================================================================
-- This migration makes the slug column nullable and adds a default value
-- to prevent "null value in column slug violates not-null constraint" errors
--
-- Execute this SQL in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Step 1: Make slug column nullable (remove NOT NULL constraint)
ALTER TABLE public.products
ALTER COLUMN slug DROP NOT NULL;

-- Step 2: Add default value for new products
ALTER TABLE public.products
ALTER COLUMN slug SET DEFAULT 'pending-slug';

-- Step 3: Update any existing NULL or temp slugs
UPDATE public.products
SET slug = 'pending-slug-' || id::text
WHERE slug IS NULL OR slug = 'temp-slug';

-- Step 4: Verify the changes
SELECT id, title, slug
FROM public.products
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- After executing this SQL:
-- 1. Products can be created without immediate slug (will use default)
-- 2. The app code will update the slug after product creation
-- 3. No more constraint violation errors
-- ============================================================================
