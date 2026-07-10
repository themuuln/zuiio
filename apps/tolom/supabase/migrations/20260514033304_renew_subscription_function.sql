-- ============================================================
-- Renew Organization Subscription
-- ============================================================

create or replace function renew_organization_subscription(target_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub_id uuid;
  result jsonb;
begin
  -- Get the most recent subscription for this org
  select id into sub_id
  from public.subscription_plans
  where organization_id = target_org_id
  order by created_at desc
  limit 1;

  if sub_id is null then
    raise exception 'No subscription found for this organization';
  end if;

  -- Renew: set to active, extend expiry by 30 days, clear grace period, disable trial
  update public.subscription_plans
  set status = 'active',
      expires_at = now() + interval '30 days',
      grace_period_end = null,
      settings = '{"trial": false}'::jsonb,
      updated_at = now()
  where id = sub_id;

  select jsonb_build_object(
    'id', sp.id,
    'organization_id', sp.organization_id,
    'plan_type', sp.plan_type::text,
    'status', sp.status,
    'started_at', sp.started_at,
    'expires_at', sp.expires_at,
    'grace_period_end', sp.grace_period_end,
    'trial', (sp.settings->>'trial')::boolean
  ) into result
  from public.subscription_plans sp
  where sp.id = sub_id;

  return result;
end;
$$;

grant execute on function renew_organization_subscription to authenticated;
