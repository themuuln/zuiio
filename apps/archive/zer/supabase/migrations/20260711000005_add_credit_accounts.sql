-- =============================================
-- Credit Accounts
--
-- Add credit columns to contacts and create
-- append-only ledger for credit transactions.
-- =============================================

-- 1. Add credit columns to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS payment_terms_days INT DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0;

-- 2. Customer Account Entries (append-only ledger)
CREATE TABLE IF NOT EXISTS public.customer_account_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('sale_debit', 'payment_credit', 'refund', 'adjustment')),
  amount NUMERIC NOT NULL,
  source_type TEXT,
  source_id UUID,
  entry_date DATE DEFAULT CURRENT_DATE,
  actor_id UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT cae_amount_nonzero CHECK (amount != 0)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_cae_contact ON public.customer_account_entries(contact_id);
CREATE INDEX IF NOT EXISTS idx_cae_org ON public.customer_account_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_cae_source ON public.customer_account_entries(source_type, source_id) WHERE source_type IS NOT NULL;

-- 4. RLS
ALTER TABLE public.customer_account_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cae_select" ON public.customer_account_entries
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.read')
  );
CREATE POLICY "cae_insert" ON public.customer_account_entries
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.create')
  );
-- No UPDATE/DELETE policies — append-only ledger

-- 5. Grants
GRANT SELECT, INSERT ON public.customer_account_entries TO authenticated;
