begin;

create schema if not exists gateway;
create extension if not exists pgcrypto;

create table gateway.tenants (
 id uuid primary key default gen_random_uuid(), product_type text not null check (product_type in ('zer','tolom','zatly')),
 external_organization_id text not null, status text not null default 'active' check (status in ('active','disabled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique (product_type, external_organization_id)
);
create table gateway.channel_installations (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade,
 provider text not null check (provider = 'meta'), external_account_id text not null, display_name text not null,
 status text not null default 'provisioning' check (status in ('provisioning','active','provisioning_failed','reauthorization_required','disabled')),
 connected_by text not null, oauth_transaction_id uuid unique, failure_code text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique (provider, external_account_id)
);
create table gateway.channel_endpoints (
 id uuid primary key default gen_random_uuid(), installation_id uuid not null references gateway.channel_installations(id) on delete cascade,
 channel text not null check (channel in ('messenger','instagram')), external_endpoint_id text not null,
 external_parent_id text, status text not null default 'provisioning', webhook_subscribed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique (channel, external_endpoint_id)
);
create table gateway.provider_credentials (
 id uuid primary key default gen_random_uuid(), installation_id uuid not null references gateway.channel_installations(id) on delete cascade,
 credential_type text not null check (credential_type in ('meta_page_access_token','meta_user_access_token')),
 encrypted_value text not null check (encrypted_value like 'enc:v2:%'), key_version integer not null, expires_at timestamptz,
 status text not null default 'active' check (status in ('active','expired','revoked','reauthorization_required')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique (installation_id, credential_type)
);
create table gateway.oauth_transactions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade,
 requested_by text not null, provider text not null check (provider = 'meta'), state_digest text not null unique,
 selection_digest text, status text not null default 'pending' check (status in ('pending','authorized','selected','expired','failed')),
 encrypted_payload text check (encrypted_payload is null or encrypted_payload like 'enc:v2:%'),
 error_code text, expires_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table gateway.channel_installations
 add constraint channel_installations_oauth_transaction_fk
 foreign key (oauth_transaction_id) references gateway.oauth_transactions(id) on delete set null;
create unique index oauth_transactions_selection_unique on gateway.oauth_transactions(selection_digest) where selection_digest is not null;
create table gateway.service_request_nonces (
 client_id text not null, nonce uuid not null, expires_at timestamptz not null, created_at timestamptz not null default now(), primary key (client_id, nonce)
);
create table gateway.conversations (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade,
 endpoint_id uuid not null references gateway.channel_endpoints(id) on delete cascade, external_user_id text not null,
 audience text not null check (audience in ('internal','customer')), status text not null default 'active' check (status in ('active','handed_off','closed')),
 last_inbound_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (endpoint_id, external_user_id)
);
create table gateway.conversation_messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references gateway.conversations(id) on delete cascade,
 provider_message_id text, direction text not null check (direction in ('inbound','outbound')), kind text not null,
 content jsonb not null default '{}'::jsonb, expires_at timestamptz not null default (now() + interval '24 hours'), trace_id text not null, created_at timestamptz not null default now()
);
create unique index conversation_messages_provider_id on gateway.conversation_messages(conversation_id, provider_message_id) where provider_message_id is not null;
create table gateway.inbound_events (
 id uuid primary key default gen_random_uuid(), provider text not null check (provider = 'meta'), provider_event_id text not null,
 external_endpoint_id text not null, payload jsonb not null default '{}'::jsonb,
 status text not null default 'received' check (status in ('received','processing','ready_to_deliver','completed','retryable_failed','dead_letter')),
 attempt_count integer not null default 0, duplicate_count integer not null default 0,
 lease_expires_at timestamptz, last_error_code text, trace_id text not null,
 expires_at timestamptz not null default (now() + interval '7 days'), completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider, provider_event_id)
);
create table gateway.agent_runs (
 id uuid primary key default gen_random_uuid(), inbound_event_id uuid not null references gateway.inbound_events(id) on delete cascade,
 conversation_id uuid not null references gateway.conversations(id) on delete cascade, status text not null default 'running' check (status in ('running','completed','failed')),
 response jsonb, usage jsonb, timings jsonb, trace_id text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(inbound_event_id)
);
create table gateway.outbound_messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references gateway.conversations(id) on delete cascade,
 inbound_event_id uuid references gateway.inbound_events(id) on delete set null, pending_action_id uuid,
 kind text not null, payload jsonb not null default '{}'::jsonb,
 status text not null default 'pending' check (status in ('pending','sending','sent','retryable_failed','delivery_unknown','dead_letter')),
 attempt_count integer not null default 0, lease_expires_at timestamptz, provider_message_id text, last_error_code text, trace_id text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table gateway.pending_actions (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references gateway.conversations(id) on delete cascade,
 tool_name text not null, arguments jsonb not null default '{}'::jsonb, idempotency_key text not null, nonce_digest text not null unique,
 status text not null default 'pending' check (status in ('pending','executing','completed','rejected','expired','failed')),
 lease_expires_at timestamptz, expires_at timestamptz not null default (now() + interval '5 minutes'),
 result jsonb, error_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table gateway.outbound_messages add constraint outbound_pending_action_fk foreign key (pending_action_id) references gateway.pending_actions(id) on delete set null;
create unique index pending_actions_idempotency on gateway.pending_actions(conversation_id, idempotency_key);
create table gateway.daily_usage (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade, usage_date date not null default current_date,
 message_count integer not null default 0, token_count bigint not null default 0,
 cost_used numeric(14,6) not null default 0, api_calls integer not null default 0,
 updated_at timestamptz not null default now(), unique(tenant_id, usage_date)
);
create table gateway.rate_limit_windows (
 tenant_id uuid not null references gateway.tenants(id) on delete cascade,
 window_key text not null, window_started_at timestamptz not null default now(),
 message_count integer not null default 0, updated_at timestamptz not null default now(),
 primary key (tenant_id, window_key)
);
create table gateway.tool_audit_events (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade, conversation_id uuid references gateway.conversations(id) on delete set null,
 tool_name text not null, effect text not null, arguments jsonb not null default '{}'::jsonb, result jsonb, error_code text, trace_id text not null, created_at timestamptz not null default now(), expires_at timestamptz
);
create table gateway.context_profiles (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade, audience text not null, profile jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id, audience)
);
create table gateway.knowledge_sources (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade, title text not null, content text not null,
 visibility text not null default 'both', metadata jsonb not null default '{}'::jsonb, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table gateway.flow_versions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade, version integer not null, definition jsonb not null default '{}'::jsonb,
 status text not null default 'draft', published_at timestamptz, created_at timestamptz not null default now(), unique(tenant_id, version)
);
create table gateway.flow_runs (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade, conversation_id uuid references gateway.conversations(id) on delete cascade,
 flow_version_id uuid references gateway.flow_versions(id) on delete set null, status text not null, state jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table gateway.flow_wait_states (
 id uuid primary key default gen_random_uuid(), flow_run_id uuid not null references gateway.flow_runs(id) on delete cascade, resume_at timestamptz, state jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table gateway.handoff_configs (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade, config jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id)
);
create table gateway.handoffs (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references gateway.tenants(id) on delete cascade, conversation_id uuid references gateway.conversations(id) on delete cascade,
 status text not null default 'pending', briefing jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), resolved_at timestamptz
);

create index inbound_events_claim_idx on gateway.inbound_events(status, lease_expires_at, created_at);
create index outbound_messages_claim_idx on gateway.outbound_messages(status, lease_expires_at, created_at);
create index pending_actions_claim_idx on gateway.pending_actions(status, expires_at, lease_expires_at);
create index oauth_transactions_expiry_idx on gateway.oauth_transactions(expires_at);
create index conversation_messages_expiry_idx on gateway.conversation_messages(expires_at);
create index inbound_events_retention_idx on gateway.inbound_events(expires_at, status);
create index pending_actions_retention_idx on gateway.pending_actions(expires_at, status);

create or replace function gateway.consume_service_nonce(
 p_client_id text, p_nonce uuid, p_expires_at timestamptz
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare inserted_count integer;
begin
 delete from gateway.service_request_nonces where expires_at <= clock_timestamp();
 insert into gateway.service_request_nonces(client_id, nonce, expires_at)
 values (p_client_id, p_nonce, least(p_expires_at, clock_timestamp() + interval '10 minutes'))
 on conflict do nothing;
 get diagnostics inserted_count = row_count;
 return inserted_count = 1;
end $$;

create or replace function gateway.ingest_meta_event(
 p_provider text, p_provider_event_id text, p_external_endpoint_id text,
 p_payload jsonb, p_trace_id text
) returns table(event_id uuid, duplicate boolean)
language plpgsql security definer set search_path = '' as $$
declare resolved_id uuid;
begin
 if p_provider <> 'meta' then raise exception 'unsupported provider'; end if;
 insert into gateway.inbound_events(
  provider, provider_event_id, external_endpoint_id, payload, trace_id
 ) values (p_provider, p_provider_event_id, p_external_endpoint_id, p_payload, p_trace_id)
 on conflict(provider, provider_event_id) do nothing
 returning id into resolved_id;
 if resolved_id is not null then
  return query select resolved_id, false;
  return;
 end if;
 update gateway.inbound_events
 set duplicate_count = duplicate_count + 1, updated_at = clock_timestamp()
 where provider = p_provider and provider_event_id = p_provider_event_id
 returning id into resolved_id;
 return query select resolved_id, true;
end $$;

create or replace function gateway.claim_inbound_event(
 p_event_id uuid, p_lease_seconds integer default 60
) returns setof gateway.inbound_events
language sql security definer set search_path = '' as $$
 update gateway.inbound_events
 set status = 'processing',
     attempt_count = attempt_count + 1,
     lease_expires_at = clock_timestamp() + make_interval(secs => greatest(p_lease_seconds, 1)),
     last_error_code = null,
     updated_at = clock_timestamp()
 where id = p_event_id
   and (
    status in ('received','retryable_failed')
    or (status = 'processing' and lease_expires_at < clock_timestamp())
   )
 returning *;
$$;

create or replace function gateway.finish_agent_run(
 p_inbound_event_id uuid, p_conversation_id uuid, p_response jsonb,
 p_usage jsonb, p_timings jsonb, p_outbound_intents jsonb, p_trace_id text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare resolved_run_id uuid; intent jsonb; intent_ordinal integer := 0;
begin
 insert into gateway.agent_runs(
  inbound_event_id, conversation_id, status, response, usage, timings, trace_id
 ) values (
  p_inbound_event_id, p_conversation_id, 'completed', p_response,
  coalesce(p_usage, '{}'::jsonb), coalesce(p_timings, '{}'::jsonb), p_trace_id
 )
 on conflict(inbound_event_id) do nothing
 returning id into resolved_run_id;
 if resolved_run_id is null then
  select id into resolved_run_id from gateway.agent_runs
  where inbound_event_id = p_inbound_event_id;
  return resolved_run_id;
 end if;
 for intent in select value from jsonb_array_elements(coalesce(p_outbound_intents, '[]'::jsonb))
 loop
  insert into gateway.outbound_messages(
   conversation_id, inbound_event_id, kind, payload, status, trace_id
  ) values (
   p_conversation_id, p_inbound_event_id, coalesce(intent->>'kind','text'),
   intent, 'pending', p_trace_id
  );
  intent_ordinal := intent_ordinal + 1;
 end loop;
 update gateway.inbound_events
 set status = case when intent_ordinal = 0 then 'completed' else 'ready_to_deliver' end,
     lease_expires_at = null,
     completed_at = case when intent_ordinal = 0 then clock_timestamp() else null end,
     updated_at = clock_timestamp()
 where id = p_inbound_event_id;
 return resolved_run_id;
end $$;

create or replace function gateway.claim_outbound_message(
 p_message_id uuid default null, p_lease_seconds integer default 60
) returns setof gateway.outbound_messages
language sql security definer set search_path = '' as $$
 with candidate as (
  select id from gateway.outbound_messages
  where (p_message_id is null or id = p_message_id)
    and (
     status in ('pending','retryable_failed')
     or (status = 'sending' and lease_expires_at < clock_timestamp())
    )
  order by created_at for update skip locked limit 1
 )
 update gateway.outbound_messages as outbound
 set status = 'sending',
     attempt_count = outbound.attempt_count + 1,
     lease_expires_at = clock_timestamp() + make_interval(secs => greatest(p_lease_seconds, 1)),
     updated_at = clock_timestamp()
 from candidate where outbound.id = candidate.id
 returning outbound.*;
$$;

create or replace function gateway.mark_outbound_result(
 p_message_id uuid, p_status text, p_provider_message_id text default null,
 p_error_code text default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare related_event_id uuid; updated_count integer;
begin
 if p_status not in ('sent','retryable_failed','delivery_unknown','dead_letter') then
  raise exception 'invalid outbound status';
 end if;
 update gateway.outbound_messages
 set status = p_status,
     provider_message_id = coalesce(p_provider_message_id, provider_message_id),
     last_error_code = p_error_code, lease_expires_at = null,
     updated_at = clock_timestamp()
 where id = p_message_id and status = 'sending'
 returning inbound_event_id into related_event_id;
 get diagnostics updated_count = row_count;
 if updated_count = 1 and related_event_id is not null and not exists (
  select 1 from gateway.outbound_messages
  where inbound_event_id = related_event_id
    and status in ('pending','sending','retryable_failed')
 ) then
  update gateway.inbound_events
  set status = case when exists (
        select 1 from gateway.outbound_messages
        where inbound_event_id = related_event_id and status = 'dead_letter'
      ) then 'dead_letter' else 'completed' end,
      completed_at = clock_timestamp(), last_error_code = p_error_code,
      updated_at = clock_timestamp()
  where id = related_event_id;
 end if;
 return updated_count = 1;
end $$;

create or replace function gateway.stage_pending_action(
 p_conversation_id uuid, p_tool_name text, p_arguments jsonb,
 p_idempotency_key text, p_nonce_digest text, p_expires_at timestamptz,
 p_confirmation_payload jsonb, p_trace_id text
) returns gateway.pending_actions
language plpgsql security definer set search_path = '' as $$
declare action_row gateway.pending_actions;
begin
 insert into gateway.pending_actions(
  conversation_id, tool_name, arguments, idempotency_key, nonce_digest, expires_at
 ) values (
  p_conversation_id, p_tool_name, p_arguments, p_idempotency_key,
  p_nonce_digest, least(p_expires_at, clock_timestamp() + interval '5 minutes')
 )
 on conflict(conversation_id, idempotency_key) do nothing
 returning * into action_row;
 if action_row.id is null then
  select * into action_row from gateway.pending_actions
  where conversation_id = p_conversation_id and idempotency_key = p_idempotency_key;
  return action_row;
 end if;
 insert into gateway.outbound_messages(
  conversation_id, pending_action_id, kind, payload, trace_id
 ) values (
  p_conversation_id, action_row.id, 'quick_replies', p_confirmation_payload, p_trace_id
 );
 return action_row;
end $$;

create or replace function gateway.claim_pending_action(
 p_conversation_id uuid, p_nonce_digest text, p_lease_seconds integer default 60
) returns setof gateway.pending_actions
language plpgsql security definer set search_path = '' as $$
begin
 update gateway.pending_actions set status = 'expired', updated_at = clock_timestamp()
 where conversation_id = p_conversation_id and nonce_digest = p_nonce_digest
   and status = 'pending' and expires_at <= clock_timestamp();
 return query
 update gateway.pending_actions
 set status = 'executing',
     lease_expires_at = clock_timestamp() + make_interval(secs => greatest(p_lease_seconds, 1)),
     updated_at = clock_timestamp()
 where conversation_id = p_conversation_id and nonce_digest = p_nonce_digest
   and expires_at > clock_timestamp()
   and (
    status = 'pending'
    or (status = 'executing' and lease_expires_at < clock_timestamp())
   )
 returning *;
end $$;

create or replace function gateway.reject_pending_action(
 p_conversation_id uuid, p_nonce_digest text, p_response_payload jsonb,
 p_trace_id text, p_status text default 'rejected'
) returns setof gateway.pending_actions
language plpgsql security definer set search_path = '' as $$
begin
 return query
 with rejected as (
  update gateway.pending_actions
  set status = p_status, lease_expires_at = null, updated_at = clock_timestamp()
  where conversation_id = p_conversation_id and nonce_digest = p_nonce_digest
    and status in ('pending','executing')
  returning *
 ), outbound as (
  insert into gateway.outbound_messages(
   conversation_id, pending_action_id, kind, payload, trace_id
  )
  select p_conversation_id, rejected.id, 'text', p_response_payload, p_trace_id
  from rejected
 )
 select * from rejected;
end $$;

create or replace function gateway.complete_pending_action(
 p_action_id uuid, p_conversation_id uuid, p_status text, p_result jsonb,
 p_error_code text, p_response_payload jsonb, p_trace_id text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare updated_count integer;
begin
 with completed as (
  update gateway.pending_actions
  set status = p_status, result = p_result, error_code = p_error_code,
      lease_expires_at = null, updated_at = clock_timestamp()
  where id = p_action_id and conversation_id = p_conversation_id
    and status = 'executing' and p_status in ('completed','failed')
  returning id
 )
 insert into gateway.outbound_messages(
  conversation_id, pending_action_id, kind, payload, trace_id
 )
 select p_conversation_id, completed.id, 'text', p_response_payload, p_trace_id
 from completed;
 get diagnostics updated_count = row_count;
 return updated_count = 1;
end $$;

create or replace function gateway.increment_daily_usage(
 p_tenant_id uuid, p_window_key text, p_message_count integer default 1,
 p_token_count bigint default 0, p_cost numeric default 0,
 p_message_limit integer default null, p_token_limit bigint default null,
 p_cost_limit numeric default null, p_rate_limit integer default 20
) returns table(
 allowed boolean, reason text, messages_used integer, tokens_used bigint,
 cost_used numeric, window_messages integer
)
language plpgsql security definer set search_path = '' as $$
declare daily_row gateway.daily_usage; window_row gateway.rate_limit_windows;
begin
 insert into gateway.daily_usage(tenant_id, usage_date)
 values(p_tenant_id, current_date) on conflict do nothing;
 insert into gateway.rate_limit_windows(tenant_id, window_key)
 values(p_tenant_id, p_window_key) on conflict do nothing;
 select * into daily_row from gateway.daily_usage
 where tenant_id = p_tenant_id and usage_date = current_date for update;
 select * into window_row from gateway.rate_limit_windows
 where tenant_id = p_tenant_id and window_key = p_window_key for update;
 if window_row.window_started_at <= clock_timestamp() - interval '1 minute' then
  update gateway.rate_limit_windows
  set window_started_at = clock_timestamp(), message_count = 0, updated_at = clock_timestamp()
  where tenant_id = p_tenant_id and window_key = p_window_key returning * into window_row;
 end if;
 if window_row.message_count + p_message_count > p_rate_limit then
  return query select false, 'RATE_LIMIT', daily_row.message_count,
   daily_row.token_count, daily_row.cost_used, window_row.message_count;
  return;
 end if;
 if (p_message_limit is not null and daily_row.message_count + p_message_count > p_message_limit)
    or (p_token_limit is not null and daily_row.token_count + p_token_count > p_token_limit)
    or (p_cost_limit is not null and daily_row.cost_used + p_cost > p_cost_limit) then
  return query select false, 'DAILY_BUDGET', daily_row.message_count,
   daily_row.token_count, daily_row.cost_used, window_row.message_count;
  return;
 end if;
 update gateway.daily_usage
 set message_count = daily_usage.message_count + p_message_count,
     token_count = daily_usage.token_count + p_token_count,
     cost_used = daily_usage.cost_used + p_cost,
     api_calls = daily_usage.api_calls + 1, updated_at = clock_timestamp()
 where tenant_id = p_tenant_id and usage_date = current_date returning * into daily_row;
 update gateway.rate_limit_windows
 set message_count = rate_limit_windows.message_count + p_message_count,
     updated_at = clock_timestamp()
 where tenant_id = p_tenant_id and window_key = p_window_key returning * into window_row;
 return query select true, null::text, daily_row.message_count,
  daily_row.token_count, daily_row.cost_used, window_row.message_count;
end $$;

create or replace function gateway.complete_meta_oauth(
 p_transaction_id uuid, p_tenant_id uuid, p_requested_by text,
 p_page_id text, p_page_name text, p_encrypted_page_token text,
 p_encrypted_user_token text, p_key_version integer,
 p_user_token_expires_at timestamptz, p_instagram_account_id text default null
) returns table(installation_id uuid, status text)
language plpgsql security definer set search_path = '' as $$
declare transaction_row gateway.oauth_transactions; created_id uuid;
begin
 select * into transaction_row from gateway.oauth_transactions
 where id = p_transaction_id and tenant_id = p_tenant_id
   and requested_by = p_requested_by
   and status in ('authorized','selected') and expires_at > clock_timestamp()
 for update;
 if transaction_row.id is null then raise exception 'oauth transaction unavailable'; end if;
 select id into created_id from gateway.channel_installations
 where oauth_transaction_id = p_transaction_id;
 if created_id is not null then
  return query select created_id, 'provisioning'::text;
  return;
 end if;
 insert into gateway.channel_installations(
  tenant_id, provider, external_account_id, display_name, status,
  connected_by, oauth_transaction_id
 ) values (
  p_tenant_id, 'meta', p_page_id, p_page_name, 'provisioning',
  p_requested_by, p_transaction_id
 ) returning id into created_id;
 insert into gateway.channel_endpoints(
  installation_id, channel, external_endpoint_id, external_parent_id, status
 ) values (created_id, 'messenger', p_page_id, p_page_id, 'provisioning');
 if p_instagram_account_id is not null then
  insert into gateway.channel_endpoints(
   installation_id, channel, external_endpoint_id, external_parent_id, status
  ) values (
   created_id, 'instagram', p_instagram_account_id, p_page_id, 'provisioning'
  );
 end if;
 insert into gateway.provider_credentials(
  installation_id, credential_type, encrypted_value, key_version, expires_at
 ) values
  (created_id, 'meta_page_access_token', p_encrypted_page_token, p_key_version, p_user_token_expires_at),
  (created_id, 'meta_user_access_token', p_encrypted_user_token, p_key_version, p_user_token_expires_at);
 update gateway.oauth_transactions set status = 'selected', updated_at = clock_timestamp()
 where id = p_transaction_id;
 return query select created_id, 'provisioning'::text;
end $$;

revoke all on schema gateway from public, anon, authenticated;
grant usage on schema gateway to service_role;
do $$
declare table_record record;
begin
 for table_record in
  select tablename from pg_catalog.pg_tables where schemaname = 'gateway'
 loop
  execute format('alter table gateway.%I enable row level security', table_record.tablename);
  execute format('alter table gateway.%I force row level security', table_record.tablename);
  execute format('revoke all on gateway.%I from public, anon, authenticated', table_record.tablename);
  execute format(
   'grant select, insert, update, delete on gateway.%I to service_role',
   table_record.tablename
  );
 end loop;
end $$;
revoke all on all sequences in schema gateway from public, anon, authenticated;
grant usage, select on all sequences in schema gateway to service_role;
revoke execute on all functions in schema gateway from public, anon, authenticated;
grant execute on all functions in schema gateway to service_role;
alter default privileges in schema gateway
 revoke all on tables from public, anon, authenticated;
alter default privileges in schema gateway
 revoke all on sequences from public, anon, authenticated;
alter default privileges in schema gateway
 revoke all on functions from public, anon, authenticated;
alter default privileges in schema gateway
 grant select, insert, update, delete on tables to service_role;
alter default privileges in schema gateway
 grant usage, select on sequences to service_role;

commit;
