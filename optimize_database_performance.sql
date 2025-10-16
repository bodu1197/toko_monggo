-- ============================================================================
-- Database Performance Optimization
-- ============================================================================
-- This file adds indexes and optimizations to improve server response time

-- 1. Add indexes for frequently queried columns
-- ============================================================================

-- Products table - optimized for common queries
CREATE INDEX IF NOT EXISTS idx_products_status_expires ON products(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_location ON products USING gist(ll_to_earth(latitude, longitude));

-- Product images - optimized for product queries
CREATE INDEX IF NOT EXISTS idx_product_images_slug_order ON product_images(product_slug, "order");

-- Categories - optimized for filtering
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category) WHERE parent_category IS NOT NULL;

-- Regencies and provinces - optimized for location filtering
CREATE INDEX IF NOT EXISTS idx_regencies_province ON regencies(province_id);

-- View history - optimized for user queries
CREATE INDEX IF NOT EXISTS idx_view_history_user_viewed ON view_history(user_id, viewed_at DESC);

-- Favorites - optimized for user queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at DESC);

-- Comments - optimized for product queries
CREATE INDEX IF NOT EXISTS idx_comments_slug_created ON product_comments(product_slug, created_at DESC);

-- 2. Add full-text search indexes (if not exists)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('indonesian', title || ' ' || COALESCE(description, '')));

-- 3. Optimize RPC functions with proper indexes
-- ============================================================================

-- For nearby_products function - spatial index (already created above)
-- idx_products_location

-- For search_products function - full-text search index (already created above)
-- idx_products_search

-- 4. Analyze tables to update statistics
-- ============================================================================
ANALYZE products;
ANALYZE product_images;
ANALYZE categories;
ANALYZE regencies;
ANALYZE provinces;
ANALYZE view_history;
ANALYZE favorites;
ANALYZE product_comments;

-- 5. Add composite indexes for complex queries
-- ============================================================================

-- For product listing with location and category filters
CREATE INDEX IF NOT EXISTS idx_products_composite ON products(status, expires_at, regency_id, category_id) WHERE status = 'active';

-- For user's product listings
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id, status, created_at DESC);

-- 6. Vacuum and optimize
-- ============================================================================
-- Note: Run this manually during low-traffic periods
-- VACUUM ANALYZE products;
-- VACUUM ANALYZE product_images;

-- ============================================================================
-- Performance Recommendations:
-- ============================================================================
-- 1. Enable query logging to identify slow queries
-- 2. Monitor index usage with pg_stat_user_indexes
-- 3. Consider materialized views for complex aggregations
-- 4. Use connection pooling (Supabase already does this)
-- 5. Cache frequently accessed data at application level
-- ============================================================================
