-- Drop existing policy
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Create new policy for public read access
CREATE POLICY "profiles_select_policy"
ON public.profiles
AS permissive
FOR SELECT
TO public
USING (true);