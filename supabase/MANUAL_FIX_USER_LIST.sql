-- ============================================================================
-- MANUAL FIX: User List Display Issue
-- ============================================================================
-- Problem: Type mismatch error "varchar(100) vs text" in get_all_users_with_email
-- Solution: Add explicit type casting for all string columns
--
-- HOW TO USE:
-- 1. Copy this entire file content
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run this SQL
-- 4. Refresh admin page
-- ============================================================================

-- Drop the old function first
DROP FUNCTION IF EXISTS public.get_all_users_with_email();

-- Recreate with explicit type casting for all text columns
CREATE OR REPLACE FUNCTION public.get_all_users_with_email()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  username text,
  avatar_url text,
  bio text,
  role text,
  created_at timestamp with time zone,
  is_suspended boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Only admins can call this function
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::TEXT,
    p.full_name::TEXT,
    p.username::TEXT,
    p.avatar_url::TEXT,
    p.bio::TEXT,
    p.role::TEXT,
    p.created_at,
    COALESCE(p.is_suspended, false) as is_suspended
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$function$;

-- ============================================================================
-- Test the function (optional)
-- ============================================================================
-- SELECT * FROM get_all_users_with_email();
