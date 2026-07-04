-- Migration: Create flow_templates table and add channels to automations

-- 1. Create flow_templates table
create table if not exists public.flow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null check (category in ('welcome', 'support', 'sales', 'notifications', 'general')),
  channels text[] not null default '{}',
  flow_json jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  is_builtin boolean not null default false,
  usage_count integer not null default 0,
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Add channels column to automations (preserving existing data)
alter table if exists public.automations add column if not exists channels text[] not null default '{}';

-- 3. Indexes for flow_templates
create index if not exists flow_templates_category_idx on public.flow_templates (category);
create index if not exists flow_templates_is_builtin_idx on public.flow_templates (is_builtin);
create index if not exists flow_templates_user_id_idx on public.flow_templates (user_id);
create index if not exists flow_templates_updated_at_idx on public.flow_templates (updated_at desc);

-- 4. Updated_at trigger function and trigger
create or replace function public.set_flow_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_flow_templates_updated_at on public.flow_templates;
create trigger trg_set_flow_templates_updated_at
  before update on public.flow_templates
  for each row execute function public.set_flow_templates_updated_at();

-- 5. Enable RLS
alter table public.flow_templates enable row level security;

-- 6. Service role policy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'flow_templates'
      and policyname = 'Service role full access flow_templates'
  ) then
    create policy "Service role full access flow_templates"
      on public.flow_templates
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
