-- Push Subscriptions: Web Push notification endpoints per user
-- TOLOM auto repair SaaS platform
-- Created: 2026-07-11

-- ============================================================
-- 1. Push Subscriptions table
-- ============================================================
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamp with time zone not null default now(),
  last_used_at timestamp with time zone,

  -- One subscription per endpoint (browser generates unique endpoint per registration)
  constraint unique_push_endpoint unique (endpoint)
);

-- ============================================================
-- 2. Indexes
-- ============================================================
create index idx_push_subscriptions_user on push_subscriptions(user_id);
create index idx_push_subscriptions_org on push_subscriptions(organization_id);
create index idx_push_subscriptions_org_user on push_subscriptions(organization_id, user_id);

-- ============================================================
-- 3. Row Level Security
-- ============================================================
alter table push_subscriptions enable row level security;

-- Users can view their own subscriptions
create policy "Users can view own push subscriptions"
  on push_subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users can insert their own subscriptions
create policy "Users can insert own push subscriptions"
  on push_subscriptions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Users can update their own subscriptions (e.g., last_used_at)
create policy "Users can update own push subscriptions"
  on push_subscriptions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Users can delete their own subscriptions
create policy "Users can delete own push subscriptions"
  on push_subscriptions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================
-- 4. Expose to Data API
-- ============================================================
grant select, insert, update, delete ON push_subscriptions TO authenticated;
