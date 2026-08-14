-- Telegram Owner Notifications: link tokens + chat subscriptions
-- TOLOM auto repair SaaS platform
-- Created: 2026-05-31

-- ============================================================
-- 1. Telegram Link Tokens (one-time, time-limited)
-- ============================================================
create table telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamp with time zone not null default (now() + interval '15 minutes'),
  used_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- ============================================================
-- 2. Telegram Links (chat subscriptions)
-- ============================================================
create table telegram_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  telegram_chat_id bigint not null,
  telegram_user_id bigint,
  telegram_username text,
  first_name text,
  last_name text,
  notification_preferences jsonb not null default '{
    "daily_summary": true,
    "weekly_summary": true,
    "urgent_due": true
  }'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  -- One active link per chat per user per org
  constraint unique_active_telegram_link unique (organization_id, user_id, telegram_chat_id)
);

-- ============================================================
-- 3. Indexes
-- ============================================================
create index idx_telegram_links_org on telegram_links(organization_id);
create index idx_telegram_links_user on telegram_links(user_id);
create index idx_telegram_links_chat on telegram_links(telegram_chat_id);
create index idx_telegram_links_active on telegram_links(organization_id, is_active)
  where is_active = true;
create index idx_telegram_link_tokens_hash on telegram_link_tokens(token_hash);
create index idx_telegram_link_tokens_org on telegram_link_tokens(organization_id);

-- ============================================================
-- 4. Row Level Security
-- ============================================================
alter table telegram_link_tokens enable row level security;
alter table telegram_links enable row level security;

-- telegram_link_tokens: org members can view and create tokens
create policy "Org members can view link tokens in their org"
  on telegram_link_tokens for select
  using (organization_id = get_user_organization_id());

create policy "Org members can insert link tokens in their org"
  on telegram_link_tokens for insert
  with check (
    organization_id = get_user_organization_id()
    and user_id = auth.uid()
  );

create policy "Org members can update link tokens in their org"
  on telegram_link_tokens for update
  using (organization_id = get_user_organization_id());

-- telegram_links: org members can view/manage links in their org
create policy "Org members can view telegram links in their org"
  on telegram_links for select
  using (organization_id = get_user_organization_id());

create policy "Org members can insert telegram links"
  on telegram_links for insert
  with check (
    -- Allow service role (no auth.uid()) and matching org membership
    organization_id IN (
      select organization_id from organization_users where user_id = auth.uid()
    )
  );

create policy "Org members can update telegram links in their org"
  on telegram_links for update
  using (organization_id = get_user_organization_id());

-- ============================================================
-- 5. Trigger: auto-update updated_at on telegram_links
-- ============================================================
create trigger set_updated_at
  before update on telegram_links
  for each row execute function update_updated_at_column();
