-- Add admin UPDATE policy for products table

create policy "Admins can update all products"
on "public"."products"
as permissive
for update
to authenticated
using (is_admin())
with check (is_admin());
