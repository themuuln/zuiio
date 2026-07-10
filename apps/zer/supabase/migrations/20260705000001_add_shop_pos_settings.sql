-- POS / shop checkout settings on organizations.
-- has_checkout_customer: show the customer/staff section in the checkout drawer
--   (shops without CRM needs can turn it off).
-- has_checkout_quick_amounts: show banknote quick-amount chips at checkout.
-- shop_default_payment_method: pre-selected payment method at checkout.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_checkout_customer BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_checkout_quick_amounts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS shop_default_payment_method TEXT NOT NULL DEFAULT 'cash'
    CHECK (shop_default_payment_method IN ('cash', 'card', 'bank_transfer', 'invoice'));
