-- Admin: Extend/Reset Subscription Trial
-- Created: 2026-05-27
-- Allows super admins to reset a trial (or expired) subscription
-- to a fresh 14-day trial starting now.

create or replace function admin_extend_subscription(target_org_id uuid)
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
    -- Create a fresh trial subscription if none exists
    insert into public.subscription_plans (
      organization_id, plan_type, status, started_at,
      expires_at, grace_period_end, settings
    ) values (
      target_org_id, 'enterprise'::plan_type, 'trial', now(),
      now() + interval '14 days', now() + interval '21 days',
      '{"trial": true}'::jsonb
    )
    returning id into sub_id;
  else
    -- Reset existing subscription to fresh trial
    update public.subscription_plans
    set status = 'trial',
        plan_type = 'enterprise'::plan_type,
        started_at = now(),
        expires_at = now() + interval '14 days',
        grace_period_end = now() + interval '21 days',
        settings = '{"trial": true}'::jsonb,
        updated_at = now()
    where id = sub_id;
  end if;

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

grant execute on function admin_extend_subscription to authenticated;
