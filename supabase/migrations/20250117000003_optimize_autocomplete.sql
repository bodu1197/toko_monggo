-- Optimize autocomplete functionality for better search performance

-- Create optimized autocomplete function using pg_trgm
CREATE OR REPLACE FUNCTION public.autocomplete_products(
  search_query text,
  limit_count integer DEFAULT 8
)
RETURNS TABLE(
  title text,
  category_name text,
  match_score real
) AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT DISTINCT ON (p.title)
      p.title::text,
      c.name::text as category_name,
      similarity(p.title, search_query) as match_score
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.status = 'active'
      AND p.expires_at > NOW()
      AND (
        -- Prefix match (starts with)
        p.title ILIKE search_query || '%'
        -- Or trigram similarity
        OR similarity(p.title, search_query) > 0.2
      )
  )
  SELECT * FROM search_results
  ORDER BY
    -- Exact prefix matches first
    CASE WHEN title ILIKE search_query || '%' THEN 0 ELSE 1 END,
    -- Then by similarity score
    match_score DESC,
    -- Finally alphabetically
    title
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.autocomplete_products(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.autocomplete_products(text, integer) TO authenticated;

-- Create optimized search function with better ranking
CREATE OR REPLACE FUNCTION public.search_products_optimized(
  search_query text,
  user_lat numeric DEFAULT NULL,
  user_lng numeric DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  price integer,
  condition text,
  status text,
  latitude numeric,
  longitude numeric,
  regency_id integer,
  category_id integer,
  user_id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  image_url text,
  regency_name text,
  province_name text,
  category_name text,
  distance_km numeric,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title::text,
    p.description,
    p.price,
    p.condition::text,
    p.status::text,
    p.latitude,
    p.longitude,
    p.regency_id,
    p.category_id,
    p.user_id,
    p.created_at,
    p.expires_at,
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.order LIMIT 1)::text as image_url,
    r.regency_name::text,
    pr.province_name::text,
    c.name::text as category_name,
    CASE
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      THEN (6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(p.latitude))
      ))::numeric
      ELSE NULL
    END as distance_km,
    -- Enhanced ranking algorithm
    (
      -- Text search relevance (40%)
      ts_rank(p.search_vector, to_tsquery('indonesian', search_query)) * 0.4 +
      -- Title exact match bonus (30%)
      CASE
        WHEN p.title ILIKE '%' || search_query || '%' THEN 0.3
        ELSE 0
      END +
      -- Recency score (20%)
      (1.0 / (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400 + 1)) * 0.2 +
      -- Location proximity score (10%)
      CASE
        WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL
             AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        THEN (1.0 / ((6371 * acos(
          cos(radians(user_lat)) *
          cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(user_lng)) +
          sin(radians(user_lat)) *
          sin(radians(p.latitude))
        )) + 1)) * 0.1
        ELSE 0
      END
    )::real as rank
  FROM products p
  LEFT JOIN regencies r ON p.regency_id = r.regency_id
  LEFT JOIN provinces pr ON r.province_id = pr.province_id
  LEFT JOIN categories c ON p.category_id = c.category_id
  WHERE p.search_vector @@ to_tsquery('indonesian', search_query)
    AND p.status = 'active'
    AND p.expires_at > NOW()
  ORDER BY rank DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_products_optimized(text, numeric, numeric, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_products_optimized(text, numeric, numeric, integer) TO authenticated;

-- Create index for category-based autocomplete
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
ON categories USING gin(name gin_trgm_ops);

-- Create composite index for search with location
CREATE INDEX IF NOT EXISTS idx_products_search_location
ON products(status, expires_at)
WHERE status = 'active' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create function to get popular search terms (for search suggestions)
CREATE TABLE IF NOT EXISTS search_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  search_term text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  search_count integer DEFAULT 1,
  last_searched timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Create index on search history
CREATE INDEX IF NOT EXISTS idx_search_history_term
ON search_history(search_term, last_searched DESC);

-- Function to log search terms
CREATE OR REPLACE FUNCTION public.log_search_term(
  term text,
  user_uuid uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO search_history (search_term, user_id, search_count, last_searched)
  VALUES (lower(trim(term)), user_uuid, 1, NOW())
  ON CONFLICT (search_term, user_id)
  DO UPDATE SET
    search_count = search_history.search_count + 1,
    last_searched = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_search_term(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_search_term(text, uuid) TO anon;

-- Function to get popular search terms
CREATE OR REPLACE FUNCTION public.get_popular_searches(
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  search_term text,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sh.search_term,
    SUM(sh.search_count)::bigint as total_count
  FROM search_history sh
  WHERE sh.last_searched >= NOW() - INTERVAL '30 days'
  GROUP BY sh.search_term
  ORDER BY total_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_popular_searches(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_popular_searches(integer) TO authenticated;