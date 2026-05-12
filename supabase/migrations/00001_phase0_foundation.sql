-- Phase 0: Multi-tenant foundation
-- TOLOM auto repair SaaS platform
-- Created: 2026-05-11

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- Enums
-- ============================================================
create type permission_action as enum ('create', 'read', 'update', 'delete', 'manage');
create type plan_type as enum ('starter', 'pro', 'business', 'enterprise');

-- ============================================================
-- Core Tables
-- ============================================================

-- Organizations
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  settings jsonb default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Branches (physical locations)
create table branches (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  name text not null,
  address text,
  phone text,
  email text,
  is_main boolean not null default false,
  settings jsonb default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- User profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id),
  branch_id uuid references branches(id),
  full_name text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Roles
create table roles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  name text not null,
  description text,
  is_system boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Permissions
create table permissions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  name text not null,
  resource text not null,
  action permission_action not null,
  description text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Role-Permission junction
create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Organization membership (user belongs to org with a role)
create table organization_users (
  organization_id uuid not null references organizations(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid references roles(id),
  branch_id uuid references branches(id),
  is_primary boolean not null default false,
  joined_at timestamp with time zone not null default now(),
  primary key (organization_id, user_id)
);

-- ============================================================
-- Audit & Logging
-- ============================================================
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  user_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone not null default now()
);

-- ============================================================
-- Feature / Plan Tables
-- ============================================================
create table subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  plan_type plan_type not null default 'starter',
  status text not null default 'active',
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table feature_flags (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  flag_key text not null,
  enabled boolean not null default false,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ============================================================
-- Settings
-- ============================================================
create table organization_settings (
  organization_id uuid primary key references organizations(id),
  invoice_prefix text default 'INV',
  default_currency text default 'MNT',
  default_tax_rate numeric(5,2) default 0,
  timezone text default 'Asia/Ulaanbaatar',
  date_format text default 'YYYY-MM-DD',
  sms_enabled boolean not null default false,
  qpay_enabled boolean not null default false,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ============================================================
-- Helper Function: get the user's organization_id
-- ============================================================
create or replace function get_user_organization_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select organization_id
  from public.organization_users
  where user_id = auth.uid()
  limit 1;
$$;

-- ============================================================
-- Enable Row Level Security on ALL tables
-- ============================================================
alter table organizations enable row level security;
alter table branches enable row level security;
alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table organization_users enable row level security;
alter table audit_logs enable row level security;
alter table subscription_plans enable row level security;
alter table feature_flags enable row level security;
alter table organization_settings enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

-- ----------------------------------------------------------
-- organizations
-- ----------------------------------------------------------

-- SELECT: users can see their own organization
create policy "Users can view their own organization"
  on organizations for select
  using (id = get_user_organization_id());

-- INSERT: authenticated users can create an organization
-- Application layer handles post-create membership insertion.
create policy "Authenticated users can create organizations"
  on organizations for insert
  with check (auth.uid() is not null);

-- UPDATE: only members of the organization
create policy "Org members can update their organization"
  on organizations for update
  using (id = get_user_organization_id());

-- DELETE: soft delete
create policy "Org members can soft-delete their organization"
  on organizations for delete
  using (id = get_user_organization_id());

-- ----------------------------------------------------------
-- branches
-- ----------------------------------------------------------

create policy "Users can view branches in their org"
  on branches for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert branches in their org"
  on branches for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update branches in their org"
  on branches for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete branches in their org"
  on branches for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- profiles
-- ----------------------------------------------------------

create policy "Users can view profiles in their org"
  on profiles for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- No delete policy for profiles (handled via cascade from auth.users)

-- ----------------------------------------------------------
-- roles
-- ----------------------------------------------------------

create policy "Users can view roles in their org"
  on roles for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert roles in their org"
  on roles for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update roles in their org"
  on roles for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete roles in their org"
  on roles for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- permissions
-- ----------------------------------------------------------

create policy "Users can view permissions in their org"
  on permissions for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert permissions in their org"
  on permissions for insert
  with check (
    organization_id = get_user_organization_id()
    and created_by = auth.uid()
  );

create policy "Users can update permissions in their org"
  on permissions for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete permissions in their org"
  on permissions for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- role_permissions
-- ----------------------------------------------------------

create policy "Users can view role_permissions in their org"
  on role_permissions for select
  using (
    exists (
      select 1 from roles
      where roles.id = role_permissions.role_id
      and roles.organization_id = get_user_organization_id()
    )
  );

create policy "Users can insert role_permissions in their org"
  on role_permissions for insert
  with check (
    exists (
      select 1 from roles
      where roles.id = role_permissions.role_id
      and roles.organization_id = get_user_organization_id()
    )
  );

create policy "Users can delete role_permissions in their org"
  on role_permissions for delete
  using (
    exists (
      select 1 from roles
      where roles.id = role_permissions.role_id
      and roles.organization_id = get_user_organization_id()
    )
  );

-- ----------------------------------------------------------
-- organization_users
-- ----------------------------------------------------------

create policy "Users can view org memberships they belong to"
  on organization_users for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert org memberships for their org"
  on organization_users for insert
  with check (organization_id = get_user_organization_id());

create policy "Users can update org memberships in their org"
  on organization_users for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete org memberships in their org"
  on organization_users for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------

create policy "Users can view audit logs in their org"
  on audit_logs for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert audit logs in their org"
  on audit_logs for insert
  with check (
    organization_id = get_user_organization_id()
    and user_id = auth.uid()
  );

-- audit_logs: no update or delete (immutable append-only log)

-- ----------------------------------------------------------
-- subscription_plans
-- ----------------------------------------------------------

create policy "Users can view subscriptions in their org"
  on subscription_plans for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert subscriptions in their org"
  on subscription_plans for insert
  with check (organization_id = get_user_organization_id());

create policy "Users can update subscriptions in their org"
  on subscription_plans for update
  using (organization_id = get_user_organization_id());

-- No delete policy for subscription_plans (financial records)

-- ----------------------------------------------------------
-- feature_flags
-- ----------------------------------------------------------

create policy "Users can view feature flags in their org"
  on feature_flags for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert feature flags in their org"
  on feature_flags for insert
  with check (organization_id = get_user_organization_id());

create policy "Users can update feature flags in their org"
  on feature_flags for update
  using (organization_id = get_user_organization_id());

create policy "Users can delete feature flags in their org"
  on feature_flags for delete
  using (organization_id = get_user_organization_id());

-- ----------------------------------------------------------
-- organization_settings
-- ----------------------------------------------------------

create policy "Users can view settings in their org"
  on organization_settings for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert settings in their org"
  on organization_settings for insert
  with check (organization_id = get_user_organization_id());

create policy "Users can update settings in their org"
  on organization_settings for update
  using (organization_id = get_user_organization_id());

-- No delete policy for organization_settings (one row per org, never deleted)

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
create index idx_branches_organization_id on branches(organization_id);
create index idx_profiles_organization_id on profiles(organization_id);
create index idx_roles_organization_id on roles(organization_id);
create index idx_permissions_organization_id on permissions(organization_id);
create index idx_organization_users_user_id on organization_users(user_id);
create index idx_audit_logs_organization_id on audit_logs(organization_id);
create index idx_audit_logs_table_name on audit_logs(table_name, record_id);
create index idx_subscription_plans_organization_id on subscription_plans(organization_id);
create index idx_feature_flags_organization_id on feature_flags(organization_id);

-- Composite indexes: soft-delete filtering
create index idx_branches_org_active on branches(organization_id, deleted_at) where deleted_at is null;
create index idx_roles_org_active on roles(organization_id, deleted_at) where deleted_at is null;
create index idx_permissions_org_active on permissions(organization_id, deleted_at) where deleted_at is null;

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on organizations
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on branches
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on roles
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on permissions
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on subscription_plans
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on feature_flags
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on organization_settings
  for each row execute function update_updated_at_column();
