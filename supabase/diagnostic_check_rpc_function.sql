-- Diagnostic script to check get_all_users_with_email RPC function
-- Run this in Supabase Dashboard SQL Editor to verify the function exists and works

-- 1. Check if function exists
SELECT
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_all_users_with_email';

-- 2. Check the exact signature of the function
SELECT
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_all_users_with_email';

-- 3. Test the RPC function directly (you must be logged in as admin)
-- This will show if the function works
SELECT * FROM get_all_users_with_email();

-- 4. Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Check if phone_number columns still exist (they shouldn't)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('phone_number', 'whatsapp_number');
