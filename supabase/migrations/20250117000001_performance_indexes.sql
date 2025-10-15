-- Performance optimization indexes for TokoMonggo

-- Composite indexes for frequently used queries
-- Products by status and expiry (for active product queries)
CREATE INDEX IF NOT EXISTS idx_products_status_expires_created
ON products(status, expires_at, created_at DESC)
WHERE status = 'active' AND expires_at > NOW();

-- Products by user and status (for profile page)
CREATE INDEX IF NOT EXISTS idx_products_user_status_created
ON products(user_id, status, created_at DESC);

-- Products for location-based queries with status
CREATE INDEX IF NOT EXISTS idx_products_location_status
ON products(regency_id, status, created_at DESC)
WHERE status = 'active';

-- Category and price range queries
CREATE INDEX IF NOT EXISTS idx_products_category_price_status
ON products(category_id, price, status)
WHERE status = 'active';

-- Improve text search performance
CREATE INDEX IF NOT EXISTS idx_products_search_vector_status
ON products USING gin(search_vector)
WHERE status = 'active';

-- Product images optimization - cover index
CREATE INDEX IF NOT EXISTS idx_product_images_product_order_url
ON product_images(product_id, "order", image_url);

-- Favorites with user and created date
CREATE INDEX IF NOT EXISTS idx_favorites_user_created
ON favorites(user_id, created_at DESC);

-- Comments by product with rating
CREATE INDEX IF NOT EXISTS idx_comments_product_rating
ON product_comments(product_id, rating)
WHERE parent_id IS NULL AND rating IS NOT NULL;

-- Access logs optimization for analytics
CREATE INDEX IF NOT EXISTS idx_access_logs_date_regency
ON access_logs(access_date DESC, regency_id)
WHERE access_date >= CURRENT_DATE - INTERVAL '30 days';

-- View history optimization
CREATE INDEX IF NOT EXISTS idx_view_history_user_viewed
ON view_history(user_id, viewed_at DESC);

-- Advertisements by position and device type
CREATE INDEX IF NOT EXISTS idx_advertisements_position_device
ON advertisements(position, device_type, is_active)
WHERE is_active = true;

-- Reports for admin dashboard
CREATE INDEX IF NOT EXISTS idx_reports_status_created
ON reports(status, created_at DESC);

-- Trash products for admin
CREATE INDEX IF NOT EXISTS idx_trash_products_deleted_user
ON trash_products(deleted_at DESC, user_id);

-- Function-based index for nearby products
CREATE INDEX IF NOT EXISTS idx_products_location_active
ON products USING gist(
  ll_to_earth(latitude::float8, longitude::float8)
)
WHERE status = 'active'
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL;

-- Partial index for products that need renewal
CREATE INDEX IF NOT EXISTS idx_products_expiring
ON products(expires_at, user_id)
WHERE status = 'active'
  AND expires_at <= NOW() + INTERVAL '7 days';

-- Index for autocomplete suggestions
CREATE INDEX IF NOT EXISTS idx_products_title_trgm
ON products USING gin(title gin_trgm_ops)
WHERE status = 'active';

-- Create trigram extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Analyze tables to update statistics
ANALYZE products;
ANALYZE product_images;
ANALYZE favorites;
ANALYZE product_comments;
ANALYZE access_logs;
ANALYZE view_history;
ANALYZE advertisements;
ANALYZE categories;
ANALYZE regencies;
ANALYZE provinces;