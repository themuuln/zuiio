-- Mechanic device registration for QR-based clock-in identity verification
-- Each mechanic registers their personal phone to sign clock-in/out actions

-- Enable pgcrypto for gen_random_uuid, digest, and crypt
create extension if not exists pgcrypto;

-- ── Table: mechanic_devices ──────────────────────────────────────────────
create table mechanic_devices (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references auth.users(id),
  organization_id uuid not null references organizations(id),
  device_name text,
  device_fingerprint text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint uq_mechanic_device unique (mechanic_id)
);

create index idx_mechanic_devices_org on mechanic_devices(organization_id);

create unique index idx_mechanic_devices_fingerprint_active
  on mechanic_devices(device_fingerprint)
  where revoked_at is null;

comment on table mechanic_devices is 'Registered phone devices per mechanic for QR clock-in identity verification';
comment on column mechanic_devices.device_fingerprint is 'Unique browser/device id set during registration';
comment on column mechanic_devices.revoked_at is 'Set when admin revokes device access (lost/stolen phone)';

-- ── Table: clock_in_tokens ──────────────────────────────────────────────
create table clock_in_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  mechanic_id uuid references auth.users(id),
  session_id uuid not null default gen_random_uuid(),
  token_hash text not null,
  action_type text not null check (action_type in ('clock_in', 'clock_out', 'register_device')),
  expires_at timestamptz not null default (now() + interval '60 seconds'),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_clock_tokens_hash on clock_in_tokens(token_hash);
create index idx_clock_tokens_org_expires on clock_in_tokens(organization_id, expires_at);

comment on table clock_in_tokens is 'Short-lived single-use tokens encoded in QR codes for clock-in/out';
comment on column clock_in_tokens.token_hash is 'SHA-256 hash of the raw token for lookup without storing plaintext';
comment on column clock_in_tokens.claimed_at is 'Set when token is used — single-use enforcement';

-- ── RLS ─────────────────────────────────────────────────────────────────-
alter table mechanic_devices enable row level security;
alter table clock_in_tokens enable row level security;

-- mechanic_devices: org members can view, mechanic registers own, admin can revoke
create policy "Organization members can view mechanic devices"
  on mechanic_devices for select
  using (organization_id = get_user_organization_id());

create policy "Mechanics can register their own device"
  on mechanic_devices for insert
  with check (
    mechanic_id = auth.uid()
    and organization_id = get_user_organization_id()
  );

create policy "Admins can update devices (revoke)"
  on mechanic_devices for update
  using (
    exists (
      select 1 from organization_users ou
      join roles r on r.id = ou.role_id
      where ou.user_id = auth.uid()
        and ou.organization_id = mechanic_devices.organization_id
        and r.name in ('org_owner', 'admin')
    )
  );

-- clock_in_tokens: org members can view and insert tokens
create policy "Organization members can view clock tokens"
  on clock_in_tokens for select
  using (organization_id = get_user_organization_id());

create policy "Organization members can insert clock tokens"
  on clock_in_tokens for insert
  with check (organization_id = get_user_organization_id());

-- ── RPC: Generate Clock Token ────────────────────────────────────────────
create or replace function public.generate_clock_token(
  p_org_id uuid,
  p_action_type text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raw_token text;
  v_session_id uuid;
  v_expires_at timestamptz;
begin
  if p_action_type not in ('clock_in', 'clock_out', 'register_device') then
    raise exception 'Invalid action_type. Must be clock_in, clock_out, or register_device.';
  end if;

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_raw_token := replace(gen_random_uuid()::text, '-', '');
  v_session_id := gen_random_uuid();
  v_expires_at := now() + interval '60 seconds';

  insert into public.clock_in_tokens (
    organization_id,
    mechanic_id,
    session_id,
    token_hash,
    action_type,
    expires_at
  ) values (
    p_org_id,
    auth.uid(),
    v_session_id,
    encode(extensions.digest(v_raw_token, 'sha256'), 'hex'),
    p_action_type,
    v_expires_at
  );

  return json_build_object(
    'raw_token', v_raw_token,
    'session_id', v_session_id,
    'expires_at', v_expires_at
  );
end;
$$;

-- ── RPC: Verify and Claim Clock Token ────────────────────────────────────
create or replace function public.verify_clock_token(
  p_raw_token text,
  p_mechanic_id uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_record record;
  v_hash text;
begin
  v_hash := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

  select * into v_token_record
  from public.clock_in_tokens
  where token_hash = v_hash
    and mechanic_id = p_mechanic_id
  for update;

  if v_token_record.id is null then
    return json_build_object('valid', false, 'reason', 'Token not found');
  end if;

  if now() > v_token_record.expires_at then
    return json_build_object('valid', false, 'reason', 'Token expired');
  end if;

  if v_token_record.claimed_at is not null then
    return json_build_object('valid', false, 'reason', 'Token already used');
  end if;

  -- Claim the token
  update public.clock_in_tokens
  set claimed_at = now()
  where id = v_token_record.id;

  return json_build_object(
    'valid', true,
    'session_id', v_token_record.session_id,
    'action_type', v_token_record.action_type
  );
end;
$$;

-- Backward-compatible registration RPC retained by the production schema.
-- The token-aware overload below is used by the newer device-registration flow.
create or replace function public.register_mechanic_device(
  p_org_id uuid,
  p_device_fingerprint text,
  p_device_name text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device_id uuid;
begin
  update public.mechanic_devices
  set revoked_at = now()
  where mechanic_id = auth.uid() and revoked_at is null;

  insert into public.mechanic_devices (
    mechanic_id,
    organization_id,
    device_name,
    device_fingerprint
  ) values (
    auth.uid(),
    p_org_id,
    coalesce(p_device_name, 'Registered device'),
    p_device_fingerprint
  )
  returning id into v_device_id;

  return json_build_object(
    'success', true,
    'device_id', v_device_id
  );
end;
$$;

-- ── RPC: Register Mechanic Device With Token ─────────────────────────────
create or replace function public.register_mechanic_device(
  p_org_id uuid,
  p_registration_token text,
  p_device_fingerprint text,
  p_device_name text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device_id uuid;
  v_token record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify registration token
  select * into v_token
  from public.clock_in_tokens
  where token_hash = encode(extensions.digest(p_registration_token, 'sha256'), 'hex')
    and action_type = 'register_device'
    and mechanic_id = auth.uid()
    and expires_at > now()
    and claimed_at is null
  for update;

  if v_token.id is null then
    return json_build_object('success', false, 'reason', 'Invalid or expired registration token');
  end if;

  -- Mark token as claimed
  update public.clock_in_tokens set claimed_at = now() where id = v_token.id;

  -- Revoke old device if exists
  update public.mechanic_devices set revoked_at = now()
  where mechanic_id = auth.uid() and revoked_at is null;

  -- Insert new device
  insert into public.mechanic_devices (mechanic_id, organization_id, device_name, device_fingerprint)
  values (auth.uid(), p_org_id, coalesce(p_device_name, 'Registered device'), p_device_fingerprint)
  returning id into v_device_id;

  return json_build_object('success', true, 'device_id', v_device_id);
end;
$$;

-- ── RPC: Admin Generate Registration Token ───────────────────────────────
create or replace function public.generate_registration_token(
  p_org_id uuid,
  p_mechanic_id uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raw_token text;
  v_session_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Check caller is admin
  if not exists (
    select 1 from organization_users ou
    join roles r on r.id = ou.role_id
    where ou.user_id = auth.uid()
      and ou.organization_id = p_org_id
      and r.name in ('org_owner', 'admin')
  ) then
    raise exception 'Only admins can generate registration tokens';
  end if;

  v_raw_token := replace(gen_random_uuid()::text, '-', '');
  v_session_id := gen_random_uuid();

  insert into public.clock_in_tokens (
    organization_id,
    mechanic_id,
    session_id,
    token_hash,
    action_type,
    expires_at
  ) values (
    p_org_id,
    p_mechanic_id,
    v_session_id,
    encode(extensions.digest(v_raw_token, 'sha256'), 'hex'),
    'register_device',
    now() + interval '5 minutes'
  );

  return json_build_object(
    'raw_token', v_raw_token,
    'session_id', v_session_id,
    'expires_at', now() + interval '5 minutes'
  );
end;
$$;

-- ── RPC: Revoke Mechanic Device ──────────────────────────────────────────
create or replace function public.revoke_mechanic_device(
  p_device_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select organization_id into v_org_id
  from public.mechanic_devices
  where id = p_device_id;

  if v_org_id is null then
    raise exception 'Device not found';
  end if;

  -- Check caller is admin in the device's org
  if not exists (
    select 1 from organization_users ou
    join roles r on r.id = ou.role_id
    where ou.user_id = auth.uid()
      and ou.organization_id = v_org_id
      and r.name in ('org_owner', 'admin')
  ) then
    raise exception 'Only admins can revoke devices';
  end if;

  update public.mechanic_devices
  set revoked_at = now()
  where id = p_device_id
    and revoked_at is null;

  return found;
end;
$$;

-- ── RPC: List Mechanic Devices ───────────────────────────────────────────
create or replace function public.list_mechanic_devices(
  p_org_id uuid,
  p_mechanic_id uuid default null
)
returns table (
  device_id uuid,
  mechanic_id uuid,
  mechanic_name text,
  device_name text,
  device_fingerprint text,
  last_used_at timestamptz,
  created_at timestamptz,
  revoked_at timestamptz,
  is_active boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Caller must be org member
  if not exists (
    select 1 from organization_users
    where user_id = auth.uid()
      and organization_id = p_org_id
  ) then
    raise exception 'Not a member of this organization';
  end if;

  return query
  select
    md.id as device_id,
    md.mechanic_id,
    p.full_name as mechanic_name,
    md.device_name,
    md.device_fingerprint,
    md.last_used_at,
    md.created_at,
    md.revoked_at,
    md.revoked_at is null as is_active
  from public.mechanic_devices md
  join public.profiles p on p.id = md.mechanic_id
  where md.organization_id = p_org_id
    and (p_mechanic_id is null or md.mechanic_id = p_mechanic_id)
  order by md.created_at desc;
end;
$$;

-- ── Grants ───────────────────────────────────────────────────────────────
revoke all on function public.generate_clock_token(uuid, text) from public;
grant execute on function public.generate_clock_token(uuid, text) to authenticated;

revoke all on function public.verify_clock_token(text, uuid) from public;
grant execute on function public.verify_clock_token(text, uuid) to authenticated;

revoke all on function public.register_mechanic_device(uuid, text, text, text) from public;
grant execute on function public.register_mechanic_device(uuid, text, text, text) to authenticated;
revoke all on function public.register_mechanic_device(uuid, text, text) from public;
grant execute on function public.register_mechanic_device(uuid, text, text) to authenticated;
revoke all on function public.generate_registration_token(uuid, uuid) from public;
grant execute on function public.generate_registration_token(uuid, uuid) to authenticated;

revoke all on function public.revoke_mechanic_device(uuid) from public;
grant execute on function public.revoke_mechanic_device(uuid) to authenticated;

revoke all on function public.list_mechanic_devices(uuid, uuid) from public;
grant execute on function public.list_mechanic_devices(uuid, uuid) to authenticated;
