# @zuiio/hr

Mongolian payroll & tax library (НДШ, ХХОАТ, илүү цаг). Rates, brackets, and validation messages reflect Mongolian labor and tax law.

## Modules

| Module | Exports | Description |
|---|---|---|
| `types` | `Employee`, `AttendanceRecord`, `LeaveRequest`, `PayrollRun`, `PayrollItem`, `OvertimeEntry`, `SocialInsuranceResult`, `IncomeTaxResult`, `PayrollCalculationInput` | Domain types for employees, attendance, leave, payroll, and calculation results |
| `constants` | `SI_RATES`, `PIT_RATES`, `OT_RATES`, `MIN_WAGE`, `DEFAULT_SI_CAP_MULTIPLIER` | Social insurance rates (employee/employer), PIT brackets, overtime multipliers, minimum wage (₮792,000) |
| `social-insurance` | `calculateSocialInsurance(gross, riskClass, minWage)` | НДШ — employee and employer shares with full breakdown (pension, benefits, health, unemployment, occupational injury) |
| `income-tax` | `calculateIncomeTax(gross, si, minWage)` | ХХОАТ — 10% base with salary-based allowances; progressive 15–20% above ₮120M annual |
| `overtime` | `calculateOvertimePay(entries, hourlyRate)` | Overtime pay: weekday 1.5×, weekend/holiday 2.0×, night +0.4× bonus |
| `salary` | `hourlyRate`, `dailyRate`, `prorateSalary` | Salary derivation — hourly (÷176h), daily (÷22d), and attendance-prorated |
| `payroll` | `computePayrollRun(input)` | Full payroll cycle — prorates salary, adds overtime/bonuses, deducts SI + PIT + deductions, returns items and summary |
| `validation` | `validateEmployee`, `validateAttendance`, `validatePayrollRun` | Mongolian-language validation — enforces minimum wage, date ordering, attendance bounds |

## Calculation flow

```
baseSalary → prorateSalary → grossPay (+ overtime + bonuses)
                                   ↓
                        calculateSocialInsurance → employeeShare, employerShare
                                   ↓
                        calculateIncomeTax(gross, si) → netTax (after SI deduction)
                                   ↓
                     netPay = gross − siEmployee − incomeTax − deductions
```

## Usage example

```ts
import { computePayrollRun } from "@zuiio/hr";
const { items, summary } = computePayrollRun({
  organizationId: "org_1",
  periodStart: "2025-01-01", periodEnd: "2025-01-31",
  employees: [{
    id: "emp_1", baseSalary: 1_500_000,  // ₮1.5M monthly
    attendanceDays: 22, workingDays: 22,
    overtimeEntries: [
      { date: "2025-01-18", hours: 4, type: "weekday" },
      { date: "2025-01-25", hours: 8, type: "weekend" },
    ],
    bonuses: 200_000, deductions: 0, riskClass: "low",
  }],
});
// items[0].netPay          — employee receives this
// summary.totalSiEmployer — employer's SI cost on top of gross
```

## Key details

- **SI cap**: 10× minimum wage (₮7,920,000) — earnings above are not subject to SI
- **PIT allowance**: scales inversely with salary (₮20k at ≤₮500k down to ₮10k at ≤₮3M); high-income >₮120M/yr uses 15–20% progressive rates
- **Night overtime**: additive 0.4× on top of base multiplier (weekday night = 1.9×)
- **Validation messages** are in Mongolian (Cyrillic) — UI should use `message` directly
