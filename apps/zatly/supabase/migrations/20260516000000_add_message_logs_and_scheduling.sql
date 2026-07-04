-- Message delivery tracking
create table if not exists public.message_logs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid references public.automations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  sender_psid text not null,
  node_id text not null,
  node_type text not null,
  message_text text,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'opened', 'clicked', 'failed')),
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error_text text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists message_logs_contact_idx on public.message_logs (contact_id);
create index if not exists message_logs_automation_idx on public.message_logs (automation_id);
create index if not exists message_logs_sender_idx on public.message_logs (sender_psid);
create index if not exists message_logs_status_idx on public.message_logs (status);
create index if not exists message_logs_sent_at_idx on public.message_logs (sent_at desc);

-- Scheduled (delayed) messages
create table if not exists public.scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  sender_psid text not null,
  automation_id uuid references public.automations(id) on delete set null,
  flow_json jsonb not null,
  current_node_id text not null,
  context jsonb not null default '{}'::jsonb,
  execute_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scheduled_messages_execute_at_idx on public.scheduled_messages (execute_at) where status = 'pending';
create index if not exists scheduled_messages_status_idx on public.scheduled_messages (status);

-- Webhook request log (for debugging)
create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'facebook' check (source in ('facebook', 'instagram', 'api')),
  direction text not null check (direction in ('incoming', 'outgoing')),
  sender_psid text,
  payload jsonb not null default '{}'::jsonb,
  response_status integer,
  response_body text,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists webhook_logs_created_at_idx on public.webhook_logs (created_at desc);
create index if not exists webhook_logs_sender_idx on public.webhook_logs (sender_psid);

-- Auto-update triggers
create or replace function public.set_scheduled_messages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_scheduled_messages_updated_at on public.scheduled_messages;
create trigger trg_set_scheduled_messages_updated_at
  before update on public.scheduled_messages
  for each row execute function public.set_scheduled_messages_updated_at();

-- RLS: service_role full access on all new tables
alter table public.message_logs enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.webhook_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'message_logs' and policyname = 'Service role full access message_logs') then
    create policy "Service role full access message_logs" on public.message_logs for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scheduled_messages' and policyname = 'Service role full access scheduled_messages') then
    create policy "Service role full access scheduled_messages" on public.scheduled_messages for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'webhook_logs' and policyname = 'Service role full access webhook_logs') then
    create policy "Service role full access webhook_logs" on public.webhook_logs for all to service_role using (true) with check (true);
  end if;
end $$;
