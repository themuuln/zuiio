-- =============================================
-- Cash Register / Till Management
-- =============================================
-- Tracks physical cash registers and daily open/close sessions.
-- Each session records opening balance, closing balance, and expected vs actual.

CREATE TABLE IF NOT EXISTS public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  register_id UUID REFERENCES public.cash_registers(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  closed_at TIMESTAMPTZ,
  closing_balance NUMERIC(12, 2),
  expected_amount NUMERIC(12, 2),
  actual_amount NUMERIC(12, 2),
  difference NUMERIC(12, 2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_org ON public.cash_registers(organization_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_org ON public.cash_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_register ON public.cash_sessions(register_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_sessions(status);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_registers_select" ON public.cash_registers
  FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "cash_registers_insert" ON public.cash_registers
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "cash_registers_update" ON public.cash_registers
  FOR UPDATE USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "cash_registers_delete" ON public.cash_registers
  FOR DELETE USING (organization_id = get_user_organization_id());

CREATE POLICY "cash_sessions_select" ON public.cash_sessions
  FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "cash_sessions_insert" ON public.cash_sessions
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "cash_sessions_update" ON public.cash_sessions
  FOR UPDATE USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
