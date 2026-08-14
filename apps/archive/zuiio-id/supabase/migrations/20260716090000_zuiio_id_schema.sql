-- zuiio-id schema: SSO identity provider for the Zuiio ecosystem
-- Designed to coexist with existing apps sharing the same database.

-- ============================================================
-- 00001: Profiles and username management
-- ============================================================

-- Enable citext for case-insensitive usernames
create extension if not exists "citext" with schema "extensions";

-- Profiles: one-to-one with auth.users
-- The table may already exist from other apps with fewer columns.
-- Add columns if missing rather than re-creating.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

do $$ begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
    and column_name = 'full_name')
  then
    alter table public.profiles add column full_name text
      check (char_length(full_name) between 1 and 80);
  end if;

  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
    and column_name = 'username')
  then
    alter table public.profiles add column username extensions.citext unique;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
    and column_name = 'avatar_url')
  then
    alter table public.profiles add column avatar_url text;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
    and column_name = 'updated_at')
  then
    alter table public.profiles add column updated_at timestamptz not null default now();
  end if;
end $$;

-- Reserved usernames that cannot be claimed
create table if not exists public.reserved_usernames (
  username extensions.citext primary key
);

insert into public.reserved_usernames (username) values
  ('admin'), ('api'), ('auth'), ('login'), ('root'),
  ('signup'), ('support'), ('system'), ('zuiio'),
  ('zer'), ('tolom'), ('tamga'), ('onoo'), ('tumurch'),
  ('zraf'), ('zoa'), ('zatly'), ('khosuud'), ('zerbu'),
  ('zunch'), ('card'), ('zill')
on conflict (username) do nothing;

-- Username validation function
create or replace function public.validate_username(username_to_check text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if length(username_to_check) < 3 or length(username_to_check) > 32 then
    raise exception 'Username must be 3-32 characters';
  end if;
  if not (username_to_check ~ '^[a-z0-9]' and username_to_check ~ '[a-z0-9]$') then
    raise exception 'Username must start and end with a letter or number';
  end if;
  if username_to_check !~ '^[a-z0-9._-]+$' then
    raise exception 'Username may only contain a-z, 0-9, ., _, or -';
  end if;
  if exists (select 1 from public.reserved_usernames where username = username_to_check) then
    raise exception 'This username is reserved';
  end if;
end;
$$;

-- Trigger to create profile on user insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'auth', 'public'
as $$
declare
  desired_username text := nullif(trim(NEW.raw_user_meta_data ->> 'username'), '');
  provider_name text := nullif(trim(NEW.raw_user_meta_data ->> 'name'), '');
  derived_full_name text;
begin
  derived_full_name := coalesce(
    nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(provider_name), ''),
    split_part(NEW.email, '@', 1)
  );
  if desired_username is not null then
    perform public.validate_username(desired_username);
    if exists (select 1 from public.profiles where username = desired_username) then
      raise exception 'Username already taken';
    end if;
  end if;
  insert into public.profiles (id, full_name, username)
  values (NEW.id, derived_full_name, desired_username);
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS on profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 00002: Product catalog
-- ============================================================

create table if not exists public.product_catalog (
  id text primary key,
  display_name text not null,
  client_id uuid not null,
  enabled boolean not null default true,
  logo_url text,
  continue_urls text[] not null default '{}'
);

create table if not exists public.auth_continuations (
  jti uuid primary key default gen_random_uuid(),
  product_id text not null references public.product_catalog(id) on delete cascade,
  return_to text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists idx_auth_continuations_expires_at
  on public.auth_continuations (expires_at)
  where consumed_at is null;

revoke all on public.product_catalog from anon, authenticated;
revoke all on public.auth_continuations from anon, authenticated;

-- Username resolver: joins profiles to auth.users for email lookup
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

-- ============================================================
-- 00003: RLS on reserved and catalog tables
-- ============================================================

alter table if exists public.reserved_usernames enable row level security;
alter table if exists public.product_catalog enable row level security;
alter table if exists public.auth_continuations enable row level security;

-- ============================================================
-- 00004: SSO audit events
-- ============================================================

create table if not exists public.sso_audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  client_id uuid,
  event_type text not null check (event_type in (
    'consent_approved',
    'consent_denied',
    'grant_revoked',
    'session_revoked',
    'mfa_enrolled',
    'mfa_unenrolled',
    'mfa_verified',
    'oauth_error'
  )),
  ip_address inet,
  user_agent text,
  metadata jsonb
);

create index if not exists idx_sso_audit_user_time on public.sso_audit_events (user_id, occurred_at desc);
create index if not exists idx_sso_audit_event_type on public.sso_audit_events (event_type, occurred_at desc);

revoke all on public.sso_audit_events from anon, authenticated;
alter table if exists public.sso_audit_events enable row level security;

-- ============================================================
-- 00005: Login rate limiting
-- ============================================================

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  ip_address inet,
  attempted_at timestamptz not null default now(),
  success boolean not null default false
);

create index if not exists idx_login_attempts_identifier_time
  on public.login_attempts (identifier, attempted_at desc);

create index if not exists idx_login_attempts_ip_time
  on public.login_attempts (ip_address, attempted_at desc);

alter table if exists public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

-- ============================================================
-- 00006: RBAC and organizations
-- ============================================================

-- System roles
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.roles (name, description, is_system) values
  ('owner', 'Бүрэн эрхтэй эзэн', true),
  ('admin', 'Админ', true),
  ('member', 'Гишүүн', true),
  ('viewer', 'Үзэгч', true)
on conflict (name) do nothing;

-- Permissions
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  action text not null,
  description text,
  unique(resource, action)
);

insert into public.permissions (resource, action, description) values
  ('invoice', 'create', 'Нэхэмжлэл үүсгэх'),
  ('invoice', 'read', 'Нэхэмжлэл харах'),
  ('invoice', 'update', 'Нэхэмжлэл засах'),
  ('invoice', 'delete', 'Нэхэмжлэл устгах'),
  ('product', 'create', 'Бараа үүсгэх'),
  ('product', 'read', 'Бараа харах'),
  ('product', 'update', 'Бараа засах'),
  ('product', 'delete', 'Бараа устгах'),
  ('settings', 'read', 'Тохиргоо харах'),
  ('settings', 'update', 'Тохиргоо засах'),
  ('member', 'invite', 'Гишүүн урих'),
  ('member', 'remove', 'Гишүүн хасах'),
  ('member', 'update_role', 'Гишүүний эрх солих'),
  ('audit', 'read', 'Аудит лог харах')
on conflict (resource, action) do nothing;

-- Role-Permission mapping
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Seed role_permissions (only for roles that don't have any yet)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'owner'
  and not exists (
    select 1 from public.role_permissions rp
    where rp.role_id = r.id
  );

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'admin'
  and not (p.resource = 'settings' and p.action = 'update')
  and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'member'
  and ((p.resource in ('invoice', 'product') and p.action in ('create', 'read', 'update', 'delete'))
    or (p.resource = 'settings' and p.action = 'read'))
  and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'viewer' and p.action = 'read'
  and not exists (select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id);

-- Organizations: extend if already exists from other apps
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add zuiio-id columns if the table existed before with fewer columns
do $$ begin
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organizations'
    and column_name = 'slug')
  then
    alter table public.organizations add column slug text;
  end if;
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organizations'
    and column_name = 'created_by')
  then
    alter table public.organizations add column created_by uuid references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organizations'
    and column_name = 'updated_at')
  then
    alter table public.organizations add column updated_at timestamptz not null default now();
  end if;
end $$;

-- Organization Memberships
create table if not exists public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  unique(org_id, user_id)
);

-- Organization Invites
create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role_id uuid not null references public.roles(id) on delete restrict,
  invited_by uuid references auth.users(id) on delete set null,
  token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_org_memberships_user on public.org_memberships (user_id);
create index if not exists idx_org_memberships_org on public.org_memberships (org_id);
create index if not exists idx_org_invites_email on public.org_invites (email);
create index if not exists idx_org_invites_token on public.org_invites (token);

-- RLS
alter table if exists public.roles enable row level security;
alter table if exists public.permissions enable row level security;
alter table if exists public.role_permissions enable row level security;
alter table if exists public.organizations enable row level security;
alter table if exists public.org_memberships enable row level security;
alter table if exists public.org_invites enable row level security;

-- RLS policies
drop policy if exists "Authenticated can read roles" on public.roles;
create policy "Authenticated can read roles"
  on public.roles for select to authenticated using (true);

drop policy if exists "Authenticated can read permissions" on public.permissions;
create policy "Authenticated can read permissions"
  on public.permissions for select to authenticated using (true);

drop policy if exists "Authenticated can read role_permissions" on public.role_permissions;
create policy "Authenticated can read role_permissions"
  on public.role_permissions for select to authenticated using (true);

drop policy if exists "Members can read their orgs" on public.organizations;
create policy "Members can read their orgs"
  on public.organizations for select to authenticated
  using (
    exists (
      select 1 from public.org_memberships
      where org_id = id and user_id = (select auth.uid())
    )
  );

drop policy if exists "Members can read org memberships" on public.org_memberships;
create policy "Members can read org memberships"
  on public.org_memberships for select to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = org_memberships.org_id and m.user_id = (select auth.uid())
    )
  );

drop policy if exists "Admins can manage invites" on public.org_invites;
create policy "Admins can manage invites"
  on public.org_invites for all to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      join public.roles r on r.id = m.role_id
      where m.org_id = org_invites.org_id
        and m.user_id = (select auth.uid())
        and r.name in ('owner', 'admin')
    )
  );

-- Updated_at trigger on organizations
drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 00007: Webhook subscriptions
-- ============================================================

create table if not exists public.webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.product_catalog(id) on delete cascade,
  url text not null,
  secret text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.webhook_subscriptions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  status text not null check (status in ('pending', 'success', 'failed')),
  response_status integer,
  response_body text,
  attempts integer not null default 0,
  next_retry_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_subscriptions_product on public.webhook_subscriptions (product_id);
create index if not exists idx_webhook_deliveries_status on public.webhook_deliveries (status, next_retry_at);
create index if not exists idx_webhook_deliveries_subscription on public.webhook_deliveries (subscription_id);

alter table if exists public.webhook_subscriptions enable row level security;
alter table if exists public.webhook_deliveries enable row level security;

revoke all on public.webhook_subscriptions from anon, authenticated;
revoke all on public.webhook_deliveries from anon, authenticated;

drop trigger if exists webhook_subscriptions_updated_at on public.webhook_subscriptions;
create trigger webhook_subscriptions_updated_at
  before update on public.webhook_subscriptions
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 00008: SCIM support
-- ============================================================

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_catalog'
    and column_name = 'scim_token'
  ) then
    alter table public.product_catalog add column scim_token text unique;
  end if;
end $$;

-- ============================================================
-- 00009: SAML configuration
-- ============================================================

create table if not exists public.saml_idps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entity_id text not null unique,
  sso_url text not null,
  slo_url text,
  certificate text not null,
  metadata_url text,
  metadata_xml text,
  name_id_format text not null default 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  product_id text references public.product_catalog(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saml_assertions (
  id uuid primary key default gen_random_uuid(),
  idp_id uuid not null references public.saml_idps(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name_id text,
  session_index text,
  attributes jsonb,
  status text not null check (status in ('success', 'error', 'denied')),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_saml_assertions_idp on public.saml_assertions (idp_id, created_at desc);
create index if not exists idx_saml_assertions_user on public.saml_assertions (user_id);

alter table if exists public.saml_idps enable row level security;
alter table if exists public.saml_assertions enable row level security;

revoke all on public.saml_idps from anon, authenticated;
revoke all on public.saml_assertions from anon, authenticated;

drop trigger if exists saml_idps_updated_at on public.saml_idps;
create trigger saml_idps_updated_at
  before update on public.saml_idps
  for each row
  execute function public.set_updated_at();
