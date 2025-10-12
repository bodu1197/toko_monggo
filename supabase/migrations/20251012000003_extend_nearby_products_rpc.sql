-- Modify nearby_products function to return full product details in a single RPC call

-- Drop the existing function
DROP FUNCTION IF EXISTS public.nearby_products(numeric, numeric, integer, integer);

-- Create or replace the function with extended return type and joins
CREATE OR REPLACE FUNCTION public.nearby_products(
  user_lat numeric,
  user_lng numeric,
  max_distance_km integer DEFAULT 50,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  title character varying(100),
  description text,
  price integer,
  condition character varying(50),
  is_negotiable boolean,
  status character varying(20),
  province_id integer,
  regency_id integer,
  latitude numeric(10,8),
  longitude numeric(11,8),
  category_id integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  phone_number character varying(15),
  whatsapp_number character varying(15),
  distance_km numeric,
  image_url text, -- First image URL
  regency_name character varying(100),
  province_name character varying(100),
  category_name character varying(100)
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
    p.description,
    p.price,
    p.condition,
    p.is_negotiable,
    p.status,
    p.province_id,
    p.regency_id,
    p.latitude,
    p.longitude,
    p.category_id,
    p.created_at,
    p.updated_at,
    p.phone_number,
    p.whatsapp_number,
    (6371 * acos(
      cos(radians(user_lat)) *
      cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) *
      sin(radians(p.latitude))
    ))::DECIMAL AS distance_km,
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.order ASC LIMIT 1) AS image_url,
    r.regency_name,
    pr.province_name,
    c.name AS category_name
  FROM products p
  LEFT JOIN regencies r ON p.regency_id = r.regency_id
  LEFT JOIN provinces pr ON r.province_id = pr.province_id
  LEFT JOIN categories c ON p.category_id = c.category_id
  WHERE
    p.status = 'active'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(user_lat)) *
      cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) *
      sin(radians(p.latitude))
    )) <= max_distance_km
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$function$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION public.nearby_products(numeric, numeric, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_products(numeric, numeric, integer, integer) TO anon;
