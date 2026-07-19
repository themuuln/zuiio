-- Flow Executor — Database Schema
-- Adds tables for deterministic flow execution to agent-gateway.
-- Run after existing agent-gateway migrations.
--
-- Tables:
--   flow_versions      — immutable published flow snapshots (from Zatly)
--   conversation_runs  — active/completed runs through flows
--   flow_wait_states   — pending waits (delays, question responses)
--   flow_outbox        — message delivery queue (outbox pattern)

-- ─── Flow Versions ────────────────────────────────────────────────────────────
-- Immutable snapshot of a published flow. Zatly writes here on "Publish".
-- The executor reads from here — never from Zatly's draft tables.

create table if not exists flow_versions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  product_type      text not null check (product_type in ('zer', 'tolom', 'zatly')),
  nodes             jsonb not null default '[]'::jsonb,
  edges             jsonb not null default '[]'::jsonb,
  channel           text,  -- null = any channel
  trigger_keywords  jsonb default '[]'::jsonb,
  is_active         boolean default false,
  version           integer not null default 1,
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),

  unique(organization_id, version)
);

create index if not exists idx_flow_versions_org_active
  on flow_versions(organization_id, is_active)
  where is_active = true;

create index if not exists idx_flow_versions_channel
  on flow_versions(channel)
  where is_active = true;

-- ─── Conversation Runs ────────────────────────────────────────────────────────
-- One row per user conversation through a flow. Tracks current position,
-- collected fields, A/B assignments, and status.

create table if not exists conversation_runs (
  id                uuid primary key default gen_random_uuid(),
  flow_version_id   uuid not null references flow_versions(id),
  organization_id   uuid not null references organizations(id) on delete cascade,
  channel           text not null,
  channel_chat_id   text not null,
  channel_user_id   text not null,
  status            text not null default 'active'
                    check (status in ('active', 'waiting', 'delayed', 'completed', 'failed', 'expired')),
  current_node_id   text not null,
  fields            jsonb default '{}'::jsonb,
  assignments       jsonb default '{}'::jsonb,
  started_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  expires_at        timestamptz,
  channel_meta      jsonb default '{}'::jsonb
);

create index if not exists idx_conversation_runs_active
  on conversation_runs(organization_id, channel, channel_chat_id, channel_user_id)
  where status in ('active', 'waiting', 'delayed');

create index if not exists idx_conversation_runs_delayed
  on conversation_runs(status, updated_at)
  where status = 'delayed';

-- ─── Flow Wait States ─────────────────────────────────────────────────────────
-- Pending waits for askQuestion (user reply) or delay (timer) nodes.
-- The cron scheduler polls for delayed waits that are ready to resume.

create table if not exists flow_wait_states (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null references conversation_runs(id) on delete cascade,
  wait_type         text not null check (wait_type in ('question_response', 'delay', 'button_callback')),
  scheduled_at      timestamptz,  -- for delays: when to resume
  expected_input    text,         -- for questions: expected input pattern
  callback_pattern  text,         -- for button callbacks: pattern to match
  created_at        timestamptz not null default now()
);

create index if not exists idx_flow_wait_states_ready
  on flow_wait_states(scheduled_at)
  where wait_type = 'delay' and scheduled_at is not null;

-- ─── Flow Outbox ──────────────────────────────────────────────────────────────
-- Message delivery queue. Messages are committed here first (transactional),
-- then sent to the channel. Failed sends are retried by a background job.

create table if not exists flow_outbox (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null references conversation_runs(id) on delete cascade,
  channel           text not null,
  channel_chat_id   text not null,
  payload           jsonb not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'sent', 'failed')),
  retry_count       integer default 0,
  max_retries       integer default 3,
  created_at        timestamptz not null default now(),
  sent_at           timestamptz,
  error             text
);

create index if not exists idx_flow_outbox_pending
  on flow_outbox(created_at)
  where status = 'pending' and retry_count < 3;

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Enable RLS on all flow executor tables.

alter table flow_versions enable row level security;
alter table conversation_runs enable row level security;
alter table flow_wait_states enable row level security;
alter table flow_outbox enable row level security;

-- Service role bypass (agent-gateway uses service-role client)
create policy "Service role full access" on flow_versions for all using (true) with check (true);
create policy "Service role full access" on conversation_runs for all using (true) with check (true);
create policy "Service role full access" on flow_wait_states for all using (true) with check (true);
create policy "Service role full access" on flow_outbox for all using (true) with check (true);
