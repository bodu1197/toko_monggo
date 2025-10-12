-- Fix nearby_products function return type to match actual table schema
-- The 'title' column in products table is character varying(100), not text

DROP FUNCTION IF EXISTS public.nearby_products(numeric, numeric, integer, integer);

CREATE OR REPLACE FUNCTION public.nearby_products(
  user_lat numeric,
  user_lng numeric,
  max_distance_km integer DEFAULT 50,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  title character varying(100),  -- Changed from 'text' to 'character varying(100)'
  price bigint,
  distance_km numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.price,
    (
      6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(p.latitude))
      )
    )::DECIMAL AS distance_km
  FROM products p
  WHERE
    p.status = 'active'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(p.latitude))
      )
    ) <= max_distance_km
  ORDER BY distance_km
  LIMIT limit_count;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.nearby_products(numeric, numeric, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_products(numeric, numeric, integer, integer) TO anon;
