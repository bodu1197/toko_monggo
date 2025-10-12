-- Remove contact information columns from profiles table
-- Contact info should only be stored per-product, not in user profiles (privacy protection)

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS phone_number,
DROP COLUMN IF EXISTS whatsapp_number;

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles - does not store contact info for privacy protection';
