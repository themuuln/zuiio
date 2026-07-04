create extension if not exists "pgcrypto";

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft' check (status in ('live', 'draft', 'off')),
  runs integer not null default 0,
  ctr numeric(5,2) not null default 0,
  trigger text not null default 'default' check (trigger in ('keyword', 'default', 'button', 'ref')),
  trigger_state text not null default 'active' check (trigger_state in ('active', 'inactive')),
  keywords text[] not null default '{}',
  folder text not null default 'General',
  flow_json jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automations_name_idx on public.automations (name);
create index if not exists automations_updated_at_idx on public.automations (updated_at desc);

create or replace function public.set_automations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_automations_updated_at on public.automations;
create trigger trg_set_automations_updated_at
before update on public.automations
for each row execute function public.set_automations_updated_at();

insert into public.automations (name, status, runs, ctr, trigger, trigger_state, keywords, folder)
values
  ('Mendchilgee', 'live', 914, 83.5, 'keyword', 'active', '{"me","m3","hi","ca","эх","ge","үн"}', 'Help menu'),
  ('Hugatsaa', 'live', 334, 77.9, 'keyword', 'active', '{"her udaj garah we"}', 'Main Menu'),
  ('Zahialga burtgel', 'draft', 0, 0, 'keyword', 'inactive', '{"zахиалга"}', 'Main Menu'),
  ('Comment Reply', 'live', 120, 0, 'default', 'active', '{"specific post","reel"}', 'General')
on conflict do nothing;

alter table public.automations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'automations'
      and policyname = 'Service role full access automations'
  ) then
    create policy "Service role full access automations"
      on public.automations
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

