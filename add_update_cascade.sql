-- ============================================================================
-- Add ON UPDATE CASCADE to foreign key constraints
-- ============================================================================
-- This allows PRIMARY KEY (slug) updates to cascade to related tables

-- Drop existing constraints
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_slug_fkey;
ALTER TABLE product_comments DROP CONSTRAINT IF EXISTS product_comments_product_slug_fkey;
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_product_slug_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_product_slug_fkey;
ALTER TABLE view_history DROP CONSTRAINT IF EXISTS view_history_product_slug_fkey;

-- Recreate with ON UPDATE CASCADE
ALTER TABLE product_images
ADD CONSTRAINT product_images_product_slug_fkey
FOREIGN KEY (product_slug) REFERENCES products(slug)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE product_comments
ADD CONSTRAINT product_comments_product_slug_fkey
FOREIGN KEY (product_slug) REFERENCES products(slug)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE favorites
ADD CONSTRAINT favorites_product_slug_fkey
FOREIGN KEY (product_slug) REFERENCES products(slug)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE reports
ADD CONSTRAINT reports_product_slug_fkey
FOREIGN KEY (reported_product_slug) REFERENCES products(slug)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE view_history
ADD CONSTRAINT view_history_product_slug_fkey
FOREIGN KEY (product_slug) REFERENCES products(slug)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- ============================================================================
-- Done! Now you can UPDATE products.slug and all related tables will update automatically
-- ============================================================================
