-- Enable RLS on remaining public tables
-- reserved_usernames and product_catalog are service-role only;
-- handle_new_user() runs as the table owner and bypasses RLS.

alter table public.reserved_usernames enable row level security;
alter table public.product_catalog enable row level security;
alter table public.auth_continuations enable row level security;

-- No public policies: access is via service_role or security-definer functions only.
-- The existing revoke grants in 00002 already block anon/authenticated.
