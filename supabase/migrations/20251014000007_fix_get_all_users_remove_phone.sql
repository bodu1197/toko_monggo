-- Fix get_all_users_with_email RPC function to remove phone_number and whatsapp_number
-- These columns were removed from profiles table in 20251012000002_remove_contact_from_profiles.sql

-- Drop the old function first (because we're changing the return type)
DROP FUNCTION IF EXISTS public.get_all_users_with_email();

-- Recreate with correct columns
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
    p.full_name,
    p.username,
    p.avatar_url,
    p.bio,
    p.role,
    p.created_at,
    COALESCE(p.is_suspended, false) as is_suspended
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$function$;
