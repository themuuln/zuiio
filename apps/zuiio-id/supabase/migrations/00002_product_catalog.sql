-- Product catalog: registry of all SSO-enabled products
-- Managed by scripts/sso/provision.ts, read by the identity app
create table public.product_catalog (
  id text primary key,
  display_name text not null,
  client_id uuid not null,
  enabled boolean not null default true,
  logo_url text,
  continue_urls text[] not null default '{}'
);

-- Auth continuations: one-time tokens tying signup/recovery back to products
create table public.auth_continuations (
  jti uuid primary key default gen_random_uuid(),
  product_id text not null references public.product_catalog(id) on delete cascade,
  return_to text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);

-- Index for cleanup of expired continuations
create index idx_auth_continuations_expires_at
  on public.auth_continuations (expires_at)
  where consumed_at is null;

-- No direct access from anon or authenticated roles
-- The identity app uses the service_role key for these tables
revoke all on public.product_catalog from anon, authenticated;
revoke all on public.auth_continuations from anon, authenticated;

-- Username resolver: joins profiles to auth.users for email lookup
-- Rate-limiting must happen at the application layer
create or replace function public.resolve_username(identifier text)
returns table (user_id uuid, user_email text)
language sql
security invoker
set search_path = 'auth', 'public'
as $$
  select u.id, u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(identifier))
     or lower(u.email) = lower(trim(identifier))
  limit 1;
$$;
