-- =============================================
-- Bank Accounts
-- =============================================
-- Tracks bank/cash accounts for transaction attribution.
-- Each sale, purchase, and expense can reference which bank account was used.

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  account_type TEXT NOT NULL DEFAULT 'bank'
    CHECK (account_type IN ('bank', 'cash', 'mobile')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_org ON public.bank_accounts(organization_id);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_accounts_select" ON public.bank_accounts
  FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "bank_accounts_insert" ON public.bank_accounts
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "bank_accounts_update" ON public.bank_accounts
  FOR UPDATE USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "bank_accounts_delete" ON public.bank_accounts
  FOR DELETE USING (organization_id = get_user_organization_id());

-- Add bank_account_id to sales, expenses, purchases
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- Seed default bank accounts for existing orgs
CREATE OR REPLACE FUNCTION public.seed_default_bank_accounts(p_organization_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.bank_accounts (organization_id, name, bank_name, account_type, is_default)
  VALUES
    (p_organization_id, 'Бэлэн мөнгө', NULL, 'cash', true),
    (p_organization_id, 'Хаан банк', 'Хаан банк', 'bank', false),
    (p_organization_id, 'Хас банк', 'Хас банк', 'bank', false)
  ON CONFLICT (organization_id, name) DO NOTHING;
END;
$$;
