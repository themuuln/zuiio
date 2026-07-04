create table if not exists public.shared_automations (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  shared_by_user_id uuid not null,
  shared_with_email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_automations_automation_idx on public.shared_automations (automation_id);
create index if not exists shared_automations_email_idx on public.shared_automations (shared_with_email);

create or replace function public.set_shared_automations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_shared_automations_updated_at on public.shared_automations;
create trigger trg_set_shared_automations_updated_at
  before update on public.shared_automations
  for each row execute function public.set_shared_automations_updated_at();

alter table public.shared_automations enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_automations' and policyname = 'Service role full access shared_automations') then
    create policy "Service role full access shared_automations" on public.shared_automations for all to service_role using (true) with check (true);
  end if;
end $$;
