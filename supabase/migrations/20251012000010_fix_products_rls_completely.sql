-- Completely fix products RLS for admin access
-- Add admin SELECT policy and fix UPDATE policy

-- First, add admin SELECT policy so admins can see all products
drop policy if exists "Products are viewable by everyone" on "public"."products";

create policy "Products are viewable by everyone or admins"
on "public"."products"
as permissive
for select
to public
using (
  ((status)::text = ANY ((ARRAY['active'::character varying, 'sold'::character varying])::text[]))
  OR is_admin()
);

-- Now fix the UPDATE policy completely
drop policy if exists "Users and admins can update products" on "public"."products";

create policy "Users and admins can update products"
on "public"."products"
as permissive
for update
to public
using (
  (auth.uid() = user_id) OR is_admin()
)
with check (
  (auth.uid() = user_id) OR is_admin()
);
