create table if not exists public.page_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  page_id text not null,
  page_name text not null,
  page_access_token text not null,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists page_connections_user_idx on public.page_connections (user_id);

create or replace function public.set_page_connections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_page_connections_updated_at on public.page_connections;
create trigger trg_set_page_connections_updated_at
  before update on public.page_connections
  for each row execute function public.set_page_connections_updated_at();

alter table public.page_connections enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'page_connections' and policyname = 'Service role full access page_connections') then
    create policy "Service role full access page_connections" on public.page_connections for all to service_role using (true) with check (true);
  end if;
end $$;
