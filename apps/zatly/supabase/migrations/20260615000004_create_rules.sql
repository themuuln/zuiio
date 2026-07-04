create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event text not null check (event in ('message_received', 'tag_added', 'contact_subscribed', 'contact_unsubscribed', 'automation_triggered')),
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  automation_id uuid references public.automations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rules_event_idx on public.rules (event);
create index if not exists rules_automation_idx on public.rules (automation_id);

create or replace function public.set_rules_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_rules_updated_at on public.rules;
create trigger trg_set_rules_updated_at
  before update on public.rules
  for each row execute function public.set_rules_updated_at();

alter table public.rules enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'rules' and policyname = 'Service role full access rules') then
    create policy "Service role full access rules" on public.rules for all to service_role using (true) with check (true);
  end if;
end $$;
