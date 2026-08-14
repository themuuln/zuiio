-- HR Module: Employees, Attendance, Leave, and Payroll tables
-- Each table is organization-scoped with standard RLS policies.

-- ─── Employees ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  hire_date DATE NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'permanent' CHECK (contract_type IN ('permanent', 'temporary', 'contract')),
  base_salary NUMERIC(12, 2) NOT NULL,
  salary_type TEXT NOT NULL DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'daily', 'hourly')),
  bank_account TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON public.employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_org_access" ON public.employees
  FOR ALL
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (organization_id = (SELECT get_current_organization()));

-- ─── Attendance Records ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day', 'holiday')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_org_access" ON public.attendance_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = attendance_records.employee_id
        AND e.organization_id = (SELECT get_current_organization())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = attendance_records.employee_id
        AND e.organization_id = (SELECT get_current_organization())
    )
  );

-- ─── Leave Requests ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'maternity', 'special')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_organization_id ON public.leave_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_org_access" ON public.leave_requests
  FOR ALL
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (organization_id = (SELECT get_current_organization()));

-- ─── Payroll Runs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
  total_gross NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_si_employee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_si_employer NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_income_tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_net NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_organization_id ON public.payroll_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON public.payroll_runs(status);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_runs_org_access" ON public.payroll_runs
  FOR ALL
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (organization_id = (SELECT get_current_organization()));

-- ─── Payroll Items ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  overtime_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bonus NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gross_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
  si_employee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  si_employer NUMERIC(12, 2) NOT NULL DEFAULT 0,
  income_tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_items_payroll_run_id ON public.payroll_items(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee_id ON public.payroll_items(employee_id);

ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_items_org_access" ON public.payroll_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr
      WHERE pr.id = payroll_items.payroll_run_id
        AND pr.organization_id = (SELECT get_current_organization())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr
      WHERE pr.id = payroll_items.payroll_run_id
        AND pr.organization_id = (SELECT get_current_organization())
    )
  );
