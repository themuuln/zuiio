-- ============================================================================
-- Audience tracking: daily page views per entity
-- ============================================================================

-- Table: public.daily_page_views
-- Tracks page view counts per entity (player, game, etc.) per day.
create table if not exists public.daily_page_views (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  view_date date not null default current_date,
  view_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforce one row per entity per day
create unique index if not exists idx_daily_page_views_entity_date
  on public.daily_page_views (entity_type, entity_id, view_date);

-- Index for aggregation queries
create index if not exists idx_daily_page_views_date
  on public.daily_page_views (view_date);

-- Index for entity-specific queries
create index if not exists idx_daily_page_views_type_date
  on public.daily_page_views (entity_type, view_date);

-- Auto-update updated_at
create or replace function private.touch_daily_page_views()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_page_views_touch on public.daily_page_views;
create trigger trg_daily_page_views_touch
  before update on public.daily_page_views
  for each row
  execute function private.touch_daily_page_views();

-- ============================================================================
-- cmd_increment_page_view — SECURITY DEFINER so anon can increment counts
-- without direct table access
-- ============================================================================
create or replace function public.cmd_increment_page_view(
  p_entity_type text,
  p_entity_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.daily_page_views (entity_type, entity_id, view_date, view_count)
  values (p_entity_type, p_entity_id, current_date, 1)
  on conflict (entity_type, entity_id, view_date)
  do update set view_count = daily_page_views.view_count + 1;
end;
$$;

-- ============================================================================
-- RLS: table is fully closed to public. Only SECURITY DEFINER functions
-- or the service_role can read/write.
-- ============================================================================
alter table public.daily_page_views enable row level security;

-- No policies granted → all rows invisible to anon/authenticated.
-- This is intentional: only the service_role client (admin API) reads this table.

-- Grant EXECUTE to anon so public pages can fire the beacon
grant execute on function public.cmd_increment_page_view(text, text) to anon;
grant execute on function public.cmd_increment_page_view(text, text) to authenticated;
