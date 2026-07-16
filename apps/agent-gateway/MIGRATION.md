# Database Migration for Zer Agent Gateway Integration

## Status

The core tables (`telegram_links`, `one_time_tokens`, `agent_sessions`) already exist and the Telegram integration
is operational. However, the following objects from
`apps/zer/supabase/migrations/20260706000000_agent_gateway_production.sql` have **not** been applied:

- `agent_daily_spend` table + `increment_daily_spend` function
- `agent_audit_log` table
- `custom_bots` table
- RLS policies on all tables
- Additional columns on `telegram_links`
- Indexes on all tables

## How to Apply

### Via Supabase Dashboard SQL Editor

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard/project/krrkhozadforrydffegg)
2. Navigate to **SQL Editor**
3. Paste the contents of one of the files below
4. Click **Run**

### Migration File
- Primary: `apps/zer/supabase/migrations/20260706000000_agent_gateway_production.sql`
- The migration is **idempotent** — safe to run multiple times (all `IF NOT EXISTS` / `DROP ... IF EXISTS`)

## Why Direct DB Connection Fails

The Supabase pooler (`aws-0-ap-southeast-1.pooler.supabase.com`) does not recognize project ref
`krrkhozadforrydffegg` — it returns `(ENOTFOUND) tenant/user postgres.krrkhozadforrydffegg not found`.
No Supabase Management API PAT is available to execute SQL via the mgmt API or CLI.
