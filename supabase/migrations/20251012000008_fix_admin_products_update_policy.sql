-- Fix admin UPDATE policy for products table
-- Remove the restrictive with check clause

drop policy if exists "Admins can update all products" on "public"."products";

create policy "Admins can update all products"
on "public"."products"
as permissive
for update
to authenticated
using (is_admin())
with check (true);
