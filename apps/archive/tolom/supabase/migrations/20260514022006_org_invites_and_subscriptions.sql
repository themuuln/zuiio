-- ============================================================
-- Org Invites + Subscription Auto-Creation
-- Created: 2026-05-14
-- ============================================================

-- ============================================================
-- 1. Org Invites Table
-- ============================================================
create table org_invites (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id),
  email text not null,
  role_id uuid references roles(id),
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by uuid references auth.users(id),
  message text,
  expires_at timestamp with time zone not null default (now() + interval '7 days'),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index idx_org_invites_token on org_invites(token);
create index idx_org_invites_organization_id on org_invites(organization_id);
create index idx_org_invites_email on org_invites(email);

-- ============================================================
-- 2. RLS for org_invites
-- ============================================================
alter table org_invites enable row level security;

create policy "Org members can view invites"
  on org_invites for select
  using (organization_id = get_user_organization_id());

create policy "Anyone can view invite by token"
  on org_invites for select
  using (true);

create policy "Org members can create invites"
  on org_invites for insert
  with check (organization_id = get_user_organization_id());

create policy "Org members can update invites"
  on org_invites for update
  using (organization_id = get_user_organization_id());

create policy "Org members can delete invites"
  on org_invites for delete
  using (organization_id = get_user_organization_id());

-- ============================================================
-- 3. Trigger: auto-update updated_at
-- ============================================================
create trigger set_updated_at
  before update on org_invites
  for each row execute function update_updated_at_column();

-- ============================================================
-- 4. RPC: lookup user by email (SECURITY DEFINER)
-- ============================================================
create or replace function lookup_user_by_email(target_email text)
returns table (user_id uuid, email text)
language sql
security definer
set search_path = 'auth'
stable
as $$
  select id as user_id, email
  from auth.users
  where lower(email) = lower(target_email)
    and deleted_at is null
  limit 1;
$$;

grant execute on function lookup_user_by_email to authenticated;

-- ============================================================
-- 4b. RPC: lookup pending invite by token (SECURITY DEFINER)
-- ============================================================
create or replace function lookup_invite_by_token(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', oi.id,
    'organization_id', oi.organization_id,
    'email', oi.email,
    'role_id', oi.role_id,
    'token', oi.token,
    'status', oi.status,
    'invited_by', oi.invited_by,
    'message', oi.message,
    'expires_at', oi.expires_at,
    'created_at', oi.created_at,
    'updated_at', oi.updated_at,
    'organization_name', o.name,
    'inviter_name', p.full_name
  )
  from public.org_invites oi
  join public.organizations o on o.id = oi.organization_id
  left join public.profiles p on p.id = oi.invited_by
  where oi.token = invite_token
    and oi.status = 'pending'
    and oi.expires_at > now()
  into result;

  return result;
end;
$$;

grant execute on function lookup_invite_by_token(text) to authenticated;

-- ============================================================
-- 5. Function: create default subscription for new org
-- ============================================================
create or replace function create_default_subscription(target_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub_id uuid;
begin
  insert into public.subscription_plans (
    organization_id,
    plan_type,
    status,
    started_at,
    expires_at,
    settings
  ) values (
    target_org_id,
    'enterprise'::plan_type,
    'trial',
    now(),
    now() + interval '14 days',
    '{"trial": true}'::jsonb
  )
  returning id into sub_id;

  return sub_id;
end;
$$;

-- ============================================================
-- 6. RPC: accept invite (redeem)
-- ============================================================
create or replace function accept_invite(invite_token text, accepting_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_record record;
  org_branch_id uuid;
  resolved_role_id uuid;
begin
  select * into invite_record
  from public.org_invites
  where token = invite_token
    and status = 'pending'
    and expires_at > now();

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invite not found, already accepted, or expired');
  end if;

  if exists (
    select 1 from public.organization_users
    where organization_id = invite_record.organization_id
      and user_id = accepting_user_id
  ) then
    return jsonb_build_object('success', false, 'error', 'You are already a member of this organization');
  end if;

  resolved_role_id := invite_record.role_id;
  if resolved_role_id is null then
    select id into resolved_role_id
    from public.roles
    where organization_id = invite_record.organization_id
      and name = 'Mechanic'
    limit 1;
  end if;

  select id into org_branch_id
  from public.branches
  where organization_id = invite_record.organization_id
    and is_main = true
  limit 1;

  insert into public.organization_users (
    organization_id, user_id, role_id, branch_id, is_primary
  ) values (
    invite_record.organization_id, accepting_user_id, resolved_role_id, org_branch_id, true
  );

  insert into public.profiles (id, organization_id, branch_id, is_active)
  values (accepting_user_id, invite_record.organization_id, org_branch_id, true)
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    branch_id = excluded.branch_id,
    updated_at = now();

  update public.org_invites
  set status = 'accepted', updated_at = now()
  where id = invite_record.id;

  return jsonb_build_object('success', true, 'organization_id', invite_record.organization_id);
end;
$$;

grant execute on function accept_invite to authenticated;

-- ============================================================
-- 7. Update default subscription to include grace period
-- ============================================================
create or replace function create_default_subscription(target_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub_id uuid;
begin
  insert into public.subscription_plans (
    organization_id,
    plan_type,
    status,
    started_at,
    expires_at,
    grace_period_end,
    settings
  ) values (
    target_org_id,
    'enterprise'::plan_type,
    'trial',
    now(),
    now() + interval '14 days',
    now() + interval '21 days',
    '{"trial": true}'::jsonb
  )
  returning id into sub_id;

  return sub_id;
end;
$$;

-- ============================================================
-- 8. Check & auto-expire subscription status
-- ============================================================
create or replace function check_org_subscription_status(target_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub_record record;
begin
  select * into sub_record
  from public.subscription_plans
  where organization_id = target_org_id
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('status', 'none', 'expired', true, 'plan_type', 'none', 'message', 'No subscription found');
  end if;

  if sub_record.status in ('trial', 'active') and sub_record.expires_at is not null and sub_record.expires_at < now() then
    update public.subscription_plans
    set status = 'expired', updated_at = now()
    where id = sub_record.id;

    return jsonb_build_object(
      'status', 'expired', 'expired', true,
      'plan_type', sub_record.plan_type,
      'expires_at', sub_record.expires_at,
      'grace_period_end', sub_record.grace_period_end,
      'message', 'Your subscription has expired'
    );
  end if;

  if sub_record.status = 'expired' then
    return jsonb_build_object(
      'status', 'expired', 'expired', true,
      'plan_type', sub_record.plan_type,
      'expires_at', sub_record.expires_at,
      'grace_period_end', sub_record.grace_period_end,
      'message', 'Your subscription has expired'
    );
  end if;

  return jsonb_build_object(
    'status', sub_record.status,
    'expired', false,
    'plan_type', sub_record.plan_type,
    'expires_at', sub_record.expires_at,
    'grace_period_end', sub_record.grace_period_end,
    'trial', (sub_record.settings->>'trial')::boolean = true
  );
end;
$$;

grant execute on function check_org_subscription_status to authenticated;
