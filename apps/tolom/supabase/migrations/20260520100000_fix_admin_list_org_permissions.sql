-- Fix: GRANT EXECUTE on admin_list_organizations was never applied on remote
-- The migration 20260514024100_super_admin_dashboard.sql created the function
-- with `grant execute on function admin_list_organizations to authenticated`
-- but this grant was missing on the remote database.

grant execute on function public.admin_list_organizations to authenticated;
