-- Facebook page connection (single-row config store)
create table if not exists public.facebook_connections (
  id         uuid primary key default gen_random_uuid(),
  page_id    text not null,
  page_name  text not null,
  page_access_token text not null,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep only the most recent connection (upsert pattern via single-row)
create unique index if not exists facebook_connections_singleton_idx
  on public.facebook_connections ((true));

create or replace function public.set_facebook_connections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_facebook_connections_updated_at on public.facebook_connections;
create trigger trg_set_facebook_connections_updated_at
before update on public.facebook_connections
for each row execute function public.set_facebook_connections_updated_at();

-- Pending OAuth page selections (expires after 15 minutes)
create table if not exists public.facebook_pending_selections (
  id         text primary key,
  pages      jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Auto-expire old selections (index for cleanup queries)
create index if not exists facebook_pending_selections_created_at_idx
  on public.facebook_pending_selections (created_at);

-- RLS: service-role-only access (matches existing tables)
alter table public.facebook_connections enable row level security;
alter table public.facebook_pending_selections enable row level security;

do $$
begin
  -- facebook_connections
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_connections'
      and policyname = 'Service role full access facebook_connections'
  ) then
    create policy "Service role full access facebook_connections"
      on public.facebook_connections
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  -- facebook_pending_selections
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'facebook_pending_selections'
      and policyname = 'Service role full access facebook_pending_selections'
  ) then
    create policy "Service role full access facebook_pending_selections"
      on public.facebook_pending_selections
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
