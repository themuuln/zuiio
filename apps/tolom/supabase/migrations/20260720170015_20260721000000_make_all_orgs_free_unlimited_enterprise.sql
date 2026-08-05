-- Make all organizations free unlimited enterprise (custom) plan
-- Created: 2026-07-21
-- Converts every org to enterprise plan_type with null expires_at (never expires)
-- Removes trial/expiry lifecycle — all orgs are always active enterprise

-- ============================================================
-- 1. Convert ALL existing subscriptions to unlimited enterprise
-- ============================================================
UPDATE public.subscription_plans
SET
    plan_type = 'enterprise'::public.plan_type,
    status = 'active',
    expires_at = NULL,
    grace_period_end = NULL,
    settings = '{"plan": "free_unlimited_enterprise", "custom": true}'::jsonb,
    updated_at = now()
WHERE plan_type != 'enterprise' OR status != 'active' OR expires_at IS NOT NULL;

-- ============================================================
-- 2. Update create_default_subscription
-- ============================================================
create or replace function public.create_default_subscription(target_org_id uuid)
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
    'enterprise'::public.plan_type,
    'active',
    now(),
    NULL,
    NULL,
    '{"plan": "free_unlimited_enterprise", "custom": true}'::jsonb
  )
  returning id into sub_id;
  return sub_id;
end;
$$;

-- ============================================================
-- 3. Update check_org_subscription_status
-- ============================================================
create or replace function public.check_org_subscription_status(target_org_id uuid)
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
    return jsonb_build_object(
      'status', 'active',
      'expired', false,
      'plan_type', 'enterprise',
      'message', 'Unlimited enterprise — always active'
    );
  end if;

  return jsonb_build_object(
    'status', 'active',
    'expired', false,
    'plan_type', sub_record.plan_type,
    'expires_at', sub_record.expires_at,
    'grace_period_end', sub_record.grace_period_end,
    'trial', false,
    'message', 'Unlimited enterprise — always active'
  );
end;
$$;

grant execute on function public.check_org_subscription_status to authenticated;

-- ============================================================
-- 4. Fix check_org_subscription_status_fast
-- ============================================================
create or replace function public.check_org_subscription_status_fast(
  target_org_id uuid
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  _result jsonb;
  _cache_key text;
begin
  _cache_key := 'cache.sub_status_' || target_org_id::text;
  _result := current_setting(_cache_key, true)::jsonb;

  if _result is not null then
    return _result;
  end if;

  select jsonb_build_object(
    'organization_id', o.id,
    'plan_type', coalesce(sp.plan_type, 'enterprise'),
    'status', 'active',
    'expires_at', NULL,
    'is_active', true
  ) into _result
  from public.organizations o
  left join public.subscription_plans sp on sp.organization_id = o.id
  where o.id = target_org_id
  order by sp.created_at desc
  limit 1;

  if _result is null then
    _result := jsonb_build_object(
      'organization_id', target_org_id,
      'plan_type', 'enterprise',
      'status', 'active',
      'expires_at', NULL,
      'is_active', true
    );
  end if;

  perform set_config(_cache_key, _result::text, true);
  return _result;
end;
$$;

grant execute on function public.check_org_subscription_status_fast to authenticated;

-- ============================================================
-- 5. Update renew_organization_subscription
-- ============================================================
create or replace function public.renew_organization_subscription(target_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub_record record;
  result jsonb;
begin
  select * into sub_record
  from public.subscription_plans
  where organization_id = target_org_id
  order by created_at desc
  limit 1;

  if not found then
    perform public.create_default_subscription(target_org_id);
    select * into sub_record
    from public.subscription_plans
    where organization_id = target_org_id
    order by created_at desc
    limit 1;
  end if;

  if sub_record.status != 'active' or sub_record.plan_type != 'enterprise' or sub_record.expires_at is not null then
    update public.subscription_plans
    set
        plan_type = 'enterprise'::public.plan_type,
        status = 'active',
        expires_at = NULL,
        grace_period_end = NULL,
        settings = '{"plan": "free_unlimited_enterprise", "custom": true}'::jsonb,
        updated_at = now()
    where id = sub_record.id;
    select * into sub_record
    from public.subscription_plans
    where id = sub_record.id;
  end if;

  select jsonb_build_object(
    'id', sp.id,
    'organization_id', sp.organization_id,
    'plan_type', sp.plan_type::text,
    'status', sp.status,
    'started_at', sp.started_at,
    'expires_at', sp.expires_at,
    'grace_period_end', sp.grace_period_end,
    'trial', false
  ) into result
  from public.subscription_plans sp
  where sp.id = sub_record.id;
  return result;
end;
$$;

grant execute on function public.renew_organization_subscription to authenticated;

-- ============================================================
-- 6. Update admin_extend_subscription
-- ============================================================
create or replace function public.admin_extend_subscription(target_org_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub_id uuid;
  result json;
begin
  if not exists (select 1 from public.super_admins where user_id = auth.uid()) then
    raise exception 'Not authorized';
  end if;

  select id into sub_id from public.subscription_plans
  where organization_id = target_org_id
  order by created_at desc
  limit 1;

  if sub_id is null then
    perform public.create_default_subscription(target_org_id);
    select id into sub_id from public.subscription_plans
    where organization_id = target_org_id
    order by created_at desc
    limit 1;
  else
    update public.subscription_plans
    set plan_type = 'enterprise'::public.plan_type,
        status = 'active',
        started_at = now(),
        expires_at = NULL,
        grace_period_end = NULL,
        settings = '{"plan": "free_unlimited_enterprise", "custom": true}'::jsonb,
        updated_at = now()
    where id = sub_id;
  end if;

  select json_build_object(
    'id', sp.id,
    'plan_type', sp.plan_type::text,
    'status', sp.status,
    'started_at', sp.started_at,
    'expires_at', sp.expires_at,
    'trial', false
  ) into result
  from public.subscription_plans sp
  where sp.id = sub_id;
  return result;
end;
$$;

grant execute on function public.admin_extend_subscription to authenticated;

-- ============================================================
-- 7. Disable the daily cron job
-- ============================================================
select cron.unschedule('expire-subscriptions-daily');

-- ============================================================
-- 8. Make invoke_expire_subscriptions a no-op
-- ============================================================
create or replace function public.invoke_expire_subscriptions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise log 'expire-subscriptions disabled: all orgs are free unlimited enterprise';
end;
$$;