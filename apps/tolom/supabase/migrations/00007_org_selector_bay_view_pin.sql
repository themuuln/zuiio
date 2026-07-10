create extension if not exists pgcrypto;

create or replace function public.get_user_organization_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select organization_id
  from public.organization_users
  where user_id = auth.uid()
  order by is_primary desc, joined_at asc
  limit 1;
$$;

create or replace function public.get_user_organizations()
returns table (
  organization_id uuid,
  name text,
  slug text,
  branch_id uuid,
  role_id uuid,
  is_primary boolean,
  has_bay_view_pin boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    ou.organization_id,
    o.name,
    o.slug,
    ou.branch_id,
    ou.role_id,
    ou.is_primary,
    o.settings ? 'bay_view_pin_hash' as has_bay_view_pin
  from public.organization_users ou
  join public.organizations o on o.id = ou.organization_id
  where ou.user_id = auth.uid()
    and o.deleted_at is null
  order by ou.is_primary desc, ou.joined_at asc, o.name asc;
$$;

create or replace function public.set_primary_organization(target_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_branch_id uuid;
begin
  if current_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1
    from public.organization_users
    where user_id = current_user_id
      and organization_id = target_org_id
  ) then
    raise exception 'Organization not found';
  end if;

  select branch_id
  into target_branch_id
  from public.organization_users
  where user_id = current_user_id
    and organization_id = target_org_id;

  update public.organization_users
  set is_primary = organization_id = target_org_id
  where user_id = current_user_id;

  update public.profiles
  set
    organization_id = target_org_id,
    branch_id = target_branch_id,
    updated_at = now()
  where id = current_user_id;

  return target_org_id;
end;
$$;

create or replace function public.set_organization_bay_view_pin(
  target_org_id uuid,
  plain_pin text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if plain_pin is null or plain_pin !~ '^[0-9]{4,6}$' then
    raise exception 'PIN must be 4 to 6 digits';
  end if;

  if not exists (
    select 1
    from public.organization_users
    where user_id = current_user_id
      and organization_id = target_org_id
  ) then
    raise exception 'Organization not found';
  end if;

  update public.organizations
  set
    settings = jsonb_set(
      coalesce(settings, '{}'::jsonb),
      '{bay_view_pin_hash}',
      to_jsonb(extensions.crypt(plain_pin, extensions.gen_salt('bf'))),
      true
    ),
    updated_at = now(),
    updated_by = current_user_id
  where id = target_org_id
    and deleted_at is null;

  if not found then
    raise exception 'Organization not found';
  end if;

  return true;
end;
$$;

create or replace function public.verify_organization_bay_view_pin(
  target_org_id uuid,
  plain_pin text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  stored_hash text;
begin
  if current_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if plain_pin is null or plain_pin !~ '^[0-9]{4,6}$' then
    raise exception 'PIN must be 4 to 6 digits';
  end if;

  select o.settings ->> 'bay_view_pin_hash'
  into stored_hash
  from public.organizations o
  join public.organization_users ou
    on ou.organization_id = o.id
  where ou.user_id = current_user_id
    and o.id = target_org_id
    and o.deleted_at is null
  limit 1;

  if stored_hash is null or stored_hash = '' then
    return false;
  end if;

  return extensions.crypt(plain_pin, stored_hash) = stored_hash;
end;
$$;

revoke all on function public.get_user_organizations() from public;
grant execute on function public.get_user_organizations() to authenticated;

revoke all on function public.set_primary_organization(uuid) from public;
grant execute on function public.set_primary_organization(uuid) to authenticated;

revoke all on function public.set_organization_bay_view_pin(uuid, text) from public;
grant execute on function public.set_organization_bay_view_pin(uuid, text) to authenticated;

revoke all on function public.verify_organization_bay_view_pin(uuid, text) from public;
grant execute on function public.verify_organization_bay_view_pin(uuid, text) to authenticated;
