import type { PayrollItem, PayrollRun } from "./types";
import { calculateSocialInsurance } from "./social-insurance";
import { calculateIncomeTax } from "./income-tax";
import { calculateOvertimePay } from "./overtime";
import { prorateSalary, hourlyRate } from "./salary";
import { MIN_WAGE } from "./constants";

interface PayrollRunInput {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  employees: {
    id: string;
    baseSalary: number;
    attendanceDays: number;
    workingDays: number;
    overtimeEntries: {
      date: string;
      hours: number;
      type: "weekday" | "weekend" | "holiday" | "night";
    }[];
    bonuses: number;
    deductions: number;
    riskClass: "low" | "mid" | "high";
  }[];
  minWage?: number;
}

export function computePayrollRun(input: PayrollRunInput): {
  items: PayrollItem[];
  summary: Omit<PayrollRun, "id" | "organizationId" | "createdAt">;
} {
  const mw = input.minWage ?? MIN_WAGE;
  const items: PayrollItem[] = [];

  for (const emp of input.employees) {
    const prorated = prorateSalary(
      emp.baseSalary,
      emp.attendanceDays,
      emp.workingDays,
    );
    const hr = hourlyRate(emp.baseSalary);
    const otPay = calculateOvertimePay(emp.overtimeEntries, hr);
    const grossPay = prorated + otPay + emp.bonuses;

    const si = calculateSocialInsurance(emp.baseSalary, emp.riskClass, mw);
    const tax = calculateIncomeTax(grossPay, si, mw);

    const netPay = grossPay - si.employeeShare - tax.netTax - emp.deductions;

    items.push({
      id: "",
      payrollRunId: "",
      employeeId: emp.id,
      baseSalary: emp.baseSalary,
      overtimePay: otPay,
      bonus: emp.bonuses,
      deduction: emp.deductions,
      grossPay,
      siEmployee: si.employeeShare,
      siEmployer: si.employerShare,
      incomeTax: tax.netTax,
      netPay,
    });
  }

  const summary = {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    status: "calculated" as const,
    totalGross: items.reduce((s, i) => s + i.grossPay, 0),
    totalSiEmployee: items.reduce((s, i) => s + i.siEmployee, 0),
    totalSiEmployer: items.reduce((s, i) => s + i.siEmployer, 0),
    totalIncomeTax: items.reduce((s, i) => s + i.incomeTax, 0),
    totalDeductions: items.reduce((s, i) => s + i.deduction, 0),
    totalNet: items.reduce((s, i) => s + i.netPay, 0),
  };

  return { items, summary };
}
