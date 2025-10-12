-- Add UPDATE RLS policy for public role on access_logs table

create policy "access_logs_update_policy"
on "public"."access_logs"
as permissive
for update
to public
using (true)
with check (true);
