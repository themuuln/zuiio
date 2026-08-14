# Payroll Module

**Purpose:** Mechanic payroll management — pay rates, payroll calculation, approval workflow, and payment tracking.

## File Structure

```
payroll/
└── page.tsx    # Single-file page (360 lines) — all logic inline, no sub-components
```

Note: This is a minimal module with no `_`-prefixed components, no sub-routes, no `loading.tsx` or `error.tsx`.

## Key Components

| Component | Role |
|-----------|------|
| `PayrollPage` | Full page with two sections: Pay Rates table and Payroll Records table |

### Pay Rates Section
- Displays editable hourly rates per mechanic
- Inline input field for editing rates
- Save button per row that calls `usePayRateUpsert`
- Shows `effective_from` date for each rate

### Payroll Records Section
- Shows calculated payroll per mechanic for selected month
- Columns: mechanic name, total hours, hourly rate, gross pay, status
- Status workflow: `draft` -> `approved` -> `paid` (with color-coded badges)
- Action buttons: "Approve" (draft), "Mark as Paid" (approved)

## Data Flow

| Source | Hook | Used By |
|--------|------|---------|
| Pay rates | `usePayRates(orgId, branchFilter)` | Pay Rates table |
| Payroll records | `usePayrollRecords(orgId, month, branchFilter)` | Payroll Records table |
| Upsert rate | `usePayRateUpsert(orgId)` | Save rate button |
| Calculate | `useCalculatePayroll(orgId)` | "Calculate" header button |
| Update record | `useUpdatePayrollRecord(orgId)` | Approve / Pay actions |

## State Management

- **Local state**: `year`, `month` (select dropdowns), `editingRates` (Record<mechanicId, rateValue>)
- **Global state**: `useSelectedBranchId` for branch filtering
- **No URL state** — year/month are local state only

## Conventions

- Currency formatted with `formatMNT()`
- Status badge colors defined in `STATUS_STYLES` map: yellow (draft), blue (approved), green (paid)
- Year range: current year +/- 2 years
- Month picker: 1-12, no locale formatting on month labels
- Empty states use `Empty` + `EmptyHeader` + `EmptyMedia` pattern
- `useMemo` for combining pay rates with mechanic names
- No error boundary or loading state at page level (may be added later)

## Dependencies

- `@/lib/queries/use-payroll` — `usePayRates`, `usePayrollRecords`, `useCalculatePayroll`, `usePayRateUpsert`, `useUpdatePayrollRecord`
- `@/lib/queries/use-organization` — org ID
- `@/lib/stores` — `useSelectedBranchId`
- `@/components/ui/table`, `select`, `input`, `badge`, `button`, `empty`, `typography`

## Known Limitations

- No `loading.tsx` or `error.tsx` — page renders inline skeletons
- No export functionality (unlike finance/expenses)
- No date range filter — only single month selection
- Mechanic names come from `(r as any).mechanic_name` — type assertion indicates data shape mismatch with pay rates response
