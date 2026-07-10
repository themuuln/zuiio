-- Follows table for mobile app
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('team', 'player', 'league')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

-- Push tokens table for notifications
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

-- RLS policies
alter table public.follows enable row level security;
alter table public.push_tokens enable row level security;

-- Follows policies
create policy "Users can view their own follows"
  on public.follows for select
  using (auth.uid() = user_id);

create policy "Users can insert their own follows"
  on public.follows for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own follows"
  on public.follows for delete
  using (auth.uid() = user_id);

-- Push tokens policies
create policy "Users can view their own push tokens"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push tokens"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own push tokens"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- Indexes
create index idx_follows_user_id on public.follows(user_id);
create index idx_follows_entity on public.follows(entity_type, entity_id);
create index idx_push_tokens_user_id on public.push_tokens(user_id);
