# @zuiio/hr — Mongolian Payroll & Tax Calculation

Pure calculation engine for Mongolian payroll: НДШ (social insurance), ХХОАТ (income tax), overtime multipliers, and salary proration. No database, no API calls — just deterministic math on input data.

## Calculation Flow

`computePayrollRun` orchestrates the full payroll pipeline per employee:

```
baseSalary
  ├─ prorateSalary()          → prorated salary (attendance / working days)
  ├─ hourlyRate()             → hourly rate for overtime
  ├─ calculateOvertimePay()   → overtime earnings (weekday 1.5×, weekend/holiday 2×, night +40%)
  ├─ grossPay                 = prorated + overtime + bonuses
  ├─ calculateSocialInsurance() → employee + employer SI shares (capped at 10× min wage)
  ├─ calculateIncomeTax()     → 10% PIT with bracket-based allowance, or high-income graduated rates
  └─ netPay                   = gross − SI employee − income tax − deductions
```

## Exports

| Module | Key exports |
|---|---|
| `types` | `Employee`, `PayrollRun`, `PayrollItem`, `OvertimeEntry`, `SocialInsuranceResult`, `IncomeTaxResult`, `PayrollCalculationInput`, `AttendanceRecord`, `LeaveRequest` |
| `constants` | `SI_RATES`, `PIT_RATES`, `OT_RATES`, `MIN_WAGE`, `DEFAULT_SI_CAP_MULTIPLIER` |
| `social-insurance` | `calculateSocialInsurance(gross, riskClass, minWage)` |
| `income-tax` | `calculateIncomeTax(gross, si, minWage)` |
| `overtime` | `calculateOvertimePay(entries, hourlyRate)` |
| `salary` | `prorateSalary(base, attendance, working)`, `hourlyRate(base)`, `dailyRate(base)` |
| `payroll` | `computePayrollRun(input)` |
| `validation` | `validateEmployee()`, `validateAttendance()`, `validatePayrollRun()` |

## Usage

```ts
import { computePayrollRun } from "@zuiio/hr";

const { items, summary } = computePayrollRun({
  organizationId: "org_abc123",
  periodStart: "2025-07-01",
  periodEnd: "2025-07-31",
  employees: [
    {
      id: "emp_001",
      baseSalary: 1_500_000,
      attendanceDays: 22,
      workingDays: 22,
      overtimeEntries: [
        { date: "2025-07-12", hours: 3, type: "weekend" },
        { date: "2025-07-18", hours: 2, type: "night" },
      ],
      bonuses: 100_000,
      deductions: 0,
      riskClass: "low",
    },
  ],
});

// items[0].netPay  — net salary for emp_001
// summary.totalNet — total net payroll for the period
```

## Module Map

```
src/
├── index.ts                 barrel re-exports
├── types.ts                 Employee, PayrollRun, PayrollItem, OvertimeEntry, ...
├── constants.ts             SI_RATES, PIT_RATES, OT_RATES, MIN_WAGE
├── social-insurance.ts      calculateSocialInsurance()
├── income-tax.ts            calculateIncomeTax()
├── overtime.ts              calculateOvertimePay()
├── salary.ts                prorateSalary(), hourlyRate(), dailyRate()
├── payroll.ts               computePayrollRun()
└── validation.ts            validateEmployee(), validateAttendance(), validatePayrollRun()
```
