/**
 * @process payroll-feature
 * @description Payroll system for TOLOM — pay rates, monthly calculation, history, and UI
 */
import { defineTask } from '@a5c-ai/babysitter-sdk';

// ═════════════════════════════════════════════════════════════════════════════
// Task Definitions
// ═════════════════════════════════════════════════════════════════════════════

const dbMigration = defineTask('db-migration', (args, taskCtx) => ({
  kind: 'skill',
  title: 'Create payroll tables migration',
  skill: {
    name: 'supabase',
    context: {
      instructions: [
        '1. Create migration 20260601150000_payroll_tables.sql:',
        '  - Table mechanic_pay_rates: id (uuid PK), organization_id (uuid FK), mechanic_id (uuid FK), hourly_rate (numeric(10,2)), effective_from (date), effective_to (date nullable), created_at, updated_at',
        '  - Table payroll_records: id (uuid PK), organization_id (uuid FK), mechanic_id (uuid FK), period_start (date), period_end (date), total_hours (numeric(6,2)), hourly_rate (numeric(10,2)), gross_pay (numeric(10,2)), status (text default draft), paid_at (timestamptz), notes (text), created_at, updated_at',
        '  - Enable RLS on both tables',
        '  - Add RLS policies: org members can read, admins/finance can write',
        '  - Index on (organization_id, mechanic_id) and (organization_id, period_start, period_end)',
        '2. Apply migration to remote via MCP supabase_apply_migration',
        '3. Generate TypeScript types via MCP supabase_generate_typescript_types',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const payrollService = defineTask('payroll-service', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build payroll service',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Backend developer',
      task: 'Create the payroll service file at src/lib/services/payroll-service.ts',
      context: { projectPath: '/Users/themuuln/coding/personal/tolom/tolom' },
      instructions: [
        'Create src/lib/services/payroll-service.ts:',
        '- getPayRate(orgId, mechanicId): SELECT FROM mechanic_pay_rates WHERE mechanic_id AND effective_to IS NULL, returns current rate',
        '- upsertPayRate(orgId, mechanicId, hourlyRate, effectiveFrom): UPDATE previous rate SET effective_to = effectiveFrom - 1 day, INSERT new rate',
        '- listPayRates(orgId): SELECT from mechanic_pay_rates JOIN profiles WHERE effective_to IS NULL',
        '- calculateMonthlyPayroll(orgId, year, month):',
        '  1. period_start = year-month-01, period_end = last day of month',
        '  2. SELECT mechanic_id, SUM(hours_worked) FROM mechanic_daily_reports WHERE report_date BETWEEN period_start AND period_end GROUP BY mechanic_id',
        '  3. For each mechanic, get their effective hourly_rate from mechanic_pay_rates',
        '  4. gross_pay = total_hours * hourly_rate',
        '  5. UPSERT into payroll_records ON CONFLICT (mechanic_id, period_start) DO UPDATE (idempotent)',
        '- getPayrollRecords(orgId, year, month): SELECT from payroll_records JOIN profiles WHERE period matches',
        '- updatePayrollRecordStatus(orgId, recordId, status): UPDATE payroll_records SET status = status, paid_at = now() if status = paid',
        '',
        'Use createClient from @/lib/supabase/server, cacheTags from @/lib/cache/keys',
      ],
      outputFormat: 'JSON with files array showing created/modified files',
    },
    outputSchema: {
      type: 'object',
      required: ['files'],
      properties: { files: { type: 'array', items: { type: 'string' } } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const payrollApi = defineTask('payroll-api', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build payroll API routes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Backend developer',
      task: 'Create 5 route files for payroll endpoints',
      context: { projectPath: '/Users/themuuln/coding/personal/tolom/tolom' },
      instructions: [
        'Create under src/app/api/organizations/[id]/payroll/:',
        '',
        '1. pay-rates/route.ts:',
        '  - export const GET = createRouteHandler(...) — calls listPayRates, { requiredPermission: { resource: "payroll", action: "read" } }',
        '  - export const PUT = createRouteHandler(...) — calls upsertPayRate from body { mechanicId, hourlyRate, effectiveFrom }, { requiredPermission: { resource: "payroll", action: "write" } }',
        '',
        '2. records/route.ts:',
        '  - export const GET = createRouteHandler(...) — reads year/month from searchParams, calls getPayrollRecords',
        '',
        '3. calculate/route.ts:',
        '  - export const POST = createRouteHandler(...) — reads year/month from body, calls calculateMonthlyPayroll',
        '',
        '4. records/[id]/route.ts:',
        '  - export const PATCH = createRouteHandler(...) — reads action from body (approve|pay), calls updatePayrollRecordStatus',
      ],
      outputFormat: 'JSON with files array',
    },
    outputSchema: {
      type: 'object',
      required: ['files'],
      properties: { files: { type: 'array', items: { type: 'string' } } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const permissionsSeed = defineTask('permissions-seed', (args, taskCtx) => ({
  kind: 'skill',
  title: 'Add payroll permissions',
  skill: {
    name: 'supabase',
    context: {
      instructions: [
        'Create migration 20260601150001_add_payroll_permissions.sql:',
        '  - INSERT INTO permissions (resource, action) VALUES (\'payroll\', \'read\'), (\'payroll\', \'write\') ON CONFLICT DO NOTHING',
        '  - Get permission IDs, then INSERT INTO role_permissions for Org Owner and Manager roles',
        '  - Study existing permission migrations for exact column names and patterns (check migrations that insert into permissions and role_permissions)',
        'Apply migration via MCP, regenerate types via MCP',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const payrollQueries = defineTask('payroll-queries', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build payroll query hooks',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend developer',
      task: 'Add payroll query keys and create use-payroll.ts',
      context: {
        projectPath: '/Users/themuuln/coding/personal/tolom/tolom',
        keysFile: 'src/lib/queries/keys.ts',
      },
      instructions: [
        'In src/lib/queries/keys.ts, add payrollKeys after expenseKeys:',
        '  export const payrollKeys = {',
        '    all: (orgId: string) => [...orgKeys.detail(orgId), "payroll"] as const,',
        '    payRates: (orgId: string) => [...payrollKeys.all(orgId), "pay-rates"] as const,',
        '    records: (orgId: string, year: number, month: number) => [...payrollKeys.all(orgId), "records", String(year), String(month)] as const,',
        '  };',
        '',
        'Create src/lib/queries/use-payroll.ts with:',
        '- usePayRates(orgId): useQuery with payrollKeys.payRates, fetcher GET pay-rates via createOrgQuery',
        '- usePayrollRecords(orgId, year, month): useQuery with payrollKeys.records, fetcher GET records',
        '- usePayRateUpsert(orgId): useMutation with PUT pay-rates, invalidates payrollKeys.payRates on success',
        '- useCalculatePayroll(orgId): useMutation with POST calculate, invalidates payrollKeys.records on success',
        '- useUpdatePayrollRecord(orgId): useMutation with PATCH records/[id], invalidates payrollKeys.records',
        '',
        'Follow patterns from use-mechanic-dashboard.ts (createOrgQuery for GET, useMutation for writes)',
      ],
      outputFormat: 'JSON with files array',
    },
    outputSchema: {
      type: 'object',
      required: ['files'],
      properties: { files: { type: 'array', items: { type: 'string' } } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const payrollPage = defineTask('payroll-page', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build payroll page + sidebar',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend developer',
      task: 'Create the payroll page, add i18n keys, add sidebar nav item',
      context: {
        projectPath: '/Users/themuuln/coding/personal/tolom/tolom',
        navHook: 'src/hooks/use-navigation.ts',
        localeEn: 'src/messages/en.json',
        localeMn: 'src/messages/mn.json',
      },
      instructions: [
        'Create src/app/[locale]/dashboard/payroll/page.tsx:',
        '  - "use client" directive',
        '  - Month/Year selector at top using Select components',
        '  - "Pay Rates" section with table: Mechanic Name, Hourly Rate (editable input), Effective From (date), Save button',
        '  - "Payroll Records" section with table: Mechanic, Total Hours, Rate, Gross Pay, Status, Actions (Approve / Mark Paid)',
        '  - "Calculate Payroll" button above records table',
        '  - Loading: Skeleton rows, Empty: Empty component when no rates',
        '  - Uses hooks: usePayRates, usePayrollRecords, usePayRateUpsert, useCalculatePayroll, useUpdatePayrollRecord',
        '  - Use shadcn components: Table, TableHeader, TableRow, TableCell, Button, Select, Input, Dialog, Badge',
        '',
        'Add i18n keys to en.json and mn.json:',
        '  payroll.title, payroll.subtitle, payroll.calculate, payroll.approve, payroll.markAsPaid',
        '  payroll.mechanic, payroll.hourlyRate, payroll.totalHours, payroll.grossPay, payroll.status',
        '  payroll.draft, payroll.approved, payroll.paid, payroll.period, payroll.month, payroll.year',
        '  payroll.noPayRates, payroll.noPayRatesDesc, nav.payroll',
        '',
        'Add Payroll to Financials nav group in use-navigation.ts after Expenses:',
        '  Find Financials group with DollarSign icon, add { labelKey: "nav.payroll", href: "/dashboard/payroll", icon: DollarSign } to its children',
      ],
      outputFormat: 'JSON with files array',
    },
    outputSchema: {
      type: 'object',
      required: ['files'],
      properties: { files: { type: 'array', items: { type: 'string' } } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const buildVerify = defineTask('build-verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Type check',
  shell: {
    command: 'cd /Users/themuuln/coding/personal/tolom/tolom && npx tsc --noEmit --incremental 2>&1; echo "EXIT:$?"',
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ═════════════════════════════════════════════════════════════════════════════
// Process Entrypoint
// ═════════════════════════════════════════════════════════════════════════════

export async function process(_inputs, ctx) {
  // Phase 1: Database migration
  await ctx.task(dbMigration, { input: {} });

  // Phase 2: Service layer
  await ctx.task(payrollService, { input: {} });

  // Phase 3: API endpoints
  await ctx.task(payrollApi, { input: {} });

  // Phase 4: Permissions
  await ctx.task(permissionsSeed, { input: {} });

  // Phase 5: Query hooks
  await ctx.task(payrollQueries, { input: {} });

  // Phase 6: Payroll page
  await ctx.task(payrollPage, { input: {} });

  // Phase 7: Verification
  await ctx.task(buildVerify, { input: {} });

  return { status: 'completed' };
}
