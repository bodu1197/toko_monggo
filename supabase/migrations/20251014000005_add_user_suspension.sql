-- Add user suspension support to profiles table
-- Allows admins to suspend problematic users

-- Add is_suspended column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Add suspended_at timestamp to track when user was suspended
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

-- Add suspended_by to track which admin suspended the user
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add suspension_reason for documentation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Create index on is_suspended for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON public.profiles(is_suspended);

-- Add admin policy to update user suspension status
CREATE POLICY "Admins can suspend users"
ON public.profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add admin policy to delete users
CREATE POLICY "Admins can delete users"
ON public.profiles
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
