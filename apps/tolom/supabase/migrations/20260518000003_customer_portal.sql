-- Customer Portal: token-based + email login
-- TOLOM auto repair SaaS platform

-- ============================================================
-- 1. Add portal_token (UUID, unique, for token-based access)
-- ============================================================
alter table customers
  add column if not exists portal_token uuid default gen_random_uuid();

-- Ensure uniqueness for token lookups
create unique index if not exists idx_customers_portal_token
  on customers(portal_token)
  where portal_token is not null and deleted_at is null;

-- ============================================================
-- 2. Add customer_user_id (FK to auth.users for email login)
-- ============================================================
alter table customers
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_customers_customer_user_id
  on customers(customer_user_id)
  where customer_user_id is not null and deleted_at is null;
