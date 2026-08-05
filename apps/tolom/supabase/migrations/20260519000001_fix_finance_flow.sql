-- ============================================================
-- Migration: Fix Finance Flow
-- - Standardize payment methods
-- - Remove QPay from organization_settings
-- - Fix super_admins RLS (enabled with policies but RLS off)
-- - Revoke PUBLIC execute on SECURITY DEFINER functions
-- ============================================================

-- ------------------------------------------------------------
-- 1. Payment Method Standardization
-- ------------------------------------------------------------

-- payments table: replace check constraint with new methods
alter table public.payments
  drop constraint if exists payments_payment_method_check;

alter table public.payments
  add constraint payments_payment_method_check
    check (payment_method in ('cash', 'card', 'bank_transfer', 'manual'));

-- invoice_payments: add check constraint for consistency
alter table public.invoice_payments
  add constraint invoice_payments_method_check
    check (method in ('cash', 'card', 'bank_transfer', 'manual'));

-- ------------------------------------------------------------
-- 2. Remove QPay from organization_settings
-- ------------------------------------------------------------
alter table public.organization_settings
  drop column if exists qpay_enabled;

-- ------------------------------------------------------------
-- 3. Fix super_admins RLS
-- ------------------------------------------------------------
alter table public.super_admins enable row level security;

-- ------------------------------------------------------------
-- 4. Revoke PUBLIC execute on SECURITY DEFINER functions
--    These are sensitive operations; only authenticated users
--    with proper authorization should call them.
-- ------------------------------------------------------------

-- Admin functions (super admin only — already GRANT'd to authenticated)
-- Each revoke is guarded: several functions exist only in production
-- (schema drift), and REVOKE on a missing function fails a fresh DB.
do $$
begin
  if to_regprocedure('public.admin_list_organizations()') is not null then
    revoke execute on function public.admin_list_organizations() from public;
  end if;
  if to_regprocedure('public.admin_update_subscription(uuid, text, text)') is not null then
    revoke execute on function public.admin_update_subscription(uuid, text, text) from public;
  end if;
end;
$$;

-- Subscription/org functions
do $$
begin
  if to_regprocedure('public.check_org_subscription_status(uuid)') is not null then
    revoke execute on function public.check_org_subscription_status(uuid) from public;
  end if;
  if to_regprocedure('public.renew_organization_subscription(uuid)') is not null then
    revoke execute on function public.renew_organization_subscription(uuid) from public;
  end if;
  if to_regprocedure('public.create_default_subscription(uuid)') is not null then
    revoke execute on function public.create_default_subscription(uuid) from public;
  end if;
end;
$$;

-- Auth/lookup functions
do $$
begin
  if to_regprocedure('public.lookup_user_by_email(text)') is not null then
    revoke execute on function public.lookup_user_by_email(text) from public;
  end if;
  if to_regprocedure('public.lookup_invite_by_token(text)') is not null then
    revoke execute on function public.lookup_invite_by_token(text) from public;
  end if;
  if to_regprocedure('public.accept_invite(text, uuid)') is not null then
    revoke execute on function public.accept_invite(text, uuid) from public;
  end if;
end;
$$;

-- Invoice functions (authenticated only; public access is via public_token)
do $$
begin
  if to_regprocedure('public.get_invoice_by_token(text)') is not null then
    revoke execute on function public.get_invoice_by_token(text) from public;
  end if;
  if to_regprocedure('public.get_public_invoice_by_token(text)') is not null then
    revoke execute on function public.get_public_invoice_by_token(text) from public;
  end if;
end;
$$;

-- Internal cron functions (not for user invocation)
do $$
begin
  if to_regprocedure('public.invoke_expire_subscriptions()') is not null then
    revoke execute on function public.invoke_expire_subscriptions() from public;
  end if;
  if to_regprocedure('public.invoke_check_service_reminders()') is not null then
    revoke execute on function public.invoke_check_service_reminders() from public;
  end if;
end;
$$;

-- Bay view PIN functions (already have individual REVOKEs in org_selector migration)
do $$
begin
  if to_regprocedure('public.set_organization_bay_view_pin(uuid, text)') is not null then
    revoke execute on function public.set_organization_bay_view_pin(uuid, text) from public;
  end if;
  if to_regprocedure('public.verify_organization_bay_view_pin(uuid, text)') is not null then
    revoke execute on function public.verify_organization_bay_view_pin(uuid, text) from public;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 5. Index for payment method lookups on invoice_payments
-- ------------------------------------------------------------
create index if not exists idx_invoice_payments_method
  on public.invoice_payments(method);
