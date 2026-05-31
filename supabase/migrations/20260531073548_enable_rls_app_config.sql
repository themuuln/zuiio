-- Enable RLS on app_config table
-- app_config stores global configuration (telegram bot tokens, webhook secrets, etc.)
-- Only super_admins should have access — edge functions use service_role key (bypasses RLS)

-- Create table if it doesn't exist (for local dev / pristine environments)
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Ensure RLS is enabled
alter table public.app_config enable row level security;

-- Drop existing policies before recreating (idempotent)
drop policy if exists "Super admins can read app_config" on public.app_config;
drop policy if exists "Super admins can insert app_config" on public.app_config;
drop policy if exists "Super admins can update app_config" on public.app_config;
drop policy if exists "Super admins can delete app_config" on public.app_config;

-- Super admins can read all app_config rows
create policy "Super admins can read app_config"
  on public.app_config for select
  using (
    auth.uid() in (select user_id from public.super_admins)
  );

-- Super admins can insert app_config rows
create policy "Super admins can insert app_config"
  on public.app_config for insert
  with check (
    auth.uid() in (select user_id from public.super_admins)
  );

-- Super admins can update app_config rows
create policy "Super admins can update app_config"
  on public.app_config for update
  using (
    auth.uid() in (select user_id from public.super_admins)
  );

-- Super admins can delete app_config rows
create policy "Super admins can delete app_config"
  on public.app_config for delete
  using (
    auth.uid() in (select user_id from public.super_admins)
  );

-- Note: Edge functions use the service_role key which bypasses all RLS policies.
-- This means telegram-webhook and telegram-notify-owners continue to work without changes.
