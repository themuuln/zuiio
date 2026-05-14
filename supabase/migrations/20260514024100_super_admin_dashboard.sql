-- Super Admin Dashboard — manage orgs & subscriptions
-- Created: 2026-05-14

create table if not exists super_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique(user_id)
);

alter table super_admins enable row level security;

create policy "Super admins can view"
  on super_admins for select
  using (auth.uid() = user_id);

create policy "Super admins can insert"
  on super_admins for insert
  with check (auth.uid() = user_id);

create policy "Super admins can delete"
  on super_admins for delete
  using (auth.uid() = user_id);

-- Security definer functions for cross-org admin access

create or replace function admin_list_organizations()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  result json;
begin
  if not exists (select 1 from public.super_admins where user_id = auth.uid()) then
    return '[]'::json;
  end if;

  select json_agg(json_build_object(
    'id', o.id,
    'name', o.name,
    'slug', o.slug,
    'is_active', o.is_active,
    'created_at', o.created_at,
    'subscription', (select json_build_object(
      'id', sp.id,
      'plan_type', sp.plan_type::text,
      'status', sp.status,
      'started_at', sp.started_at,
      'expires_at', sp.expires_at,
      'trial', (sp.settings->>'trial')::boolean
    ) from public.subscription_plans sp where sp.organization_id = o.id order by sp.created_at desc limit 1)
  ) order by o.created_at desc) into result
  from public.organizations o;

  return coalesce(result, '[]'::json);
end;
$$;

create or replace function admin_update_subscription(
  target_org_id uuid,
  new_plan_type text,
  new_status text default 'active'
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  result json;
  sub_id uuid;
begin
  if not exists (select 1 from public.super_admins where user_id = auth.uid()) then
    raise exception 'Not authorized';
  end if;

  select id into sub_id from public.subscription_plans
  where organization_id = target_org_id
  order by created_at desc
  limit 1;

  if sub_id is null then
    raise exception 'No subscription found for this organization';
  end if;

  update public.subscription_plans
  set plan_type = new_plan_type::public.plan_type,
      status = new_status,
      updated_at = now()
  where id = sub_id;

  select json_build_object(
    'id', sp.id,
    'plan_type', sp.plan_type::text,
    'status', sp.status,
    'started_at', sp.started_at,
    'expires_at', sp.expires_at,
    'trial', (sp.settings->>'trial')::boolean
  ) into result
  from public.subscription_plans sp
  where sp.id = sub_id;

  return result;
end;
$$;

grant execute on function admin_list_organizations to authenticated;
grant execute on function admin_update_subscription to authenticated;
