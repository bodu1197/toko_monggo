-- Fix products UPDATE RLS policies
-- Drop existing user update policy and recreate with proper admin support

drop policy if exists "Users can update own products" on "public"."products";
drop policy if exists "Admins can update all products" on "public"."products";

-- Single unified update policy that allows both users and admins
create policy "Users and admins can update products"
on "public"."products"
as permissive
for update
to authenticated
using (
  (auth.uid() = user_id) OR is_admin()
)
with check (
  (auth.uid() = user_id) OR is_admin()
);
