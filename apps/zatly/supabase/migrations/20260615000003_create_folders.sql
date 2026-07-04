create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folders_name_idx on public.folders (name);

create or replace function public.set_folders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_folders_updated_at on public.folders;
create trigger trg_set_folders_updated_at
  before update on public.folders
  for each row execute function public.set_folders_updated_at();

alter table public.folders enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'folders' and policyname = 'Service role full access folders') then
    create policy "Service role full access folders" on public.folders for all to service_role using (true) with check (true);
  end if;
end $$;
