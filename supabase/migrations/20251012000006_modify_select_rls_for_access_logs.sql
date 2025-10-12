-- Modify SELECT RLS policy for public role on access_logs table to be permissive

-- Drop existing SELECT policy
DROP POLICY IF EXISTS access_logs_select_policy ON public.access_logs;

-- Create new permissive SELECT policy
create policy "access_logs_select_policy"
on "public"."access_logs"
as permissive
for select
to public
using (true);
