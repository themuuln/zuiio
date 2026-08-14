-- RPC function to fetch user emails from auth.users for the export route
-- Requires service_role key to execute (auth schema is not accessible to public)
create or replace function get_users_by_ids(user_ids uuid[])
returns table (id uuid, email text)
language sql
security definer
set search_path = auth
as $$
  select id, email::text from users where id = any(user_ids);
$$;
