-- Customer Telegram Linking — accept service reminders via Telegram
-- TOLOM auto repair SaaS platform
-- Created: 2026-05-31

-- ============================================================
-- 1. Add telegram_chat_id to customers
-- ============================================================
alter table customers
  add column telegram_chat_id bigint;

create index idx_customers_telegram_chat
  on customers(telegram_chat_id)
  where telegram_chat_id is not null;

-- ============================================================
-- 2. Add 'telegram' to reminder_logs channel constraint
-- ============================================================
alter table reminder_logs
  drop constraint if exists reminder_logs_channel_check;
alter table reminder_logs
  add constraint reminder_logs_channel_check
    check (channel in ('email', 'both', 'in_app', 'telegram'));

-- ============================================================
-- 3. Add 'telegram' option to org notification settings
-- ============================================================
alter table organization_settings
  add column if not exists default_reminder_channel text
    not null default 'email'
    check (default_reminder_channel in ('email', 'telegram', 'both'));
