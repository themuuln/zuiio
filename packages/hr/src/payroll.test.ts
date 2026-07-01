import { describe, it, expect } from "vitest";
import { computePayrollRun } from "./payroll";

describe("computePayrollRun", () => {
  it("calculates a full payroll run for one employee", () => {
    const result = computePayrollRun({
      organizationId: "org-1",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      employees: [
        {
          id: "emp-1",
          baseSalary: 1_000_000,
          attendanceDays: 22,
          workingDays: 22,
          overtimeEntries: [],
          bonuses: 0,
          deductions: 0,
          riskClass: "low",
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    const item = result.items[0]!;
    expect(item.grossPay).toBe(1_000_000);
    expect(item.netPay).toBeGreaterThan(0);
    expect(item.netPay).toBeLessThan(item.grossPay);
    expect(result.summary.totalGross).toBe(1_000_000);
    expect(result.summary.totalNet).toBeLessThan(1_000_000);
  });

  it("handles multiple employees", () => {
    const result = computePayrollRun({
      organizationId: "org-1",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      employees: [
        {
          id: "emp-1",
          baseSalary: 1_000_000,
          attendanceDays: 22,
          workingDays: 22,
          overtimeEntries: [],
          bonuses: 0,
          deductions: 0,
          riskClass: "low",
        },
        {
          id: "emp-2",
          baseSalary: 2_000_000,
          attendanceDays: 20,
          workingDays: 22,
          overtimeEntries: [{ date: "2026-06-15", hours: 3, type: "weekday" }],
          bonuses: 100_000,
          deductions: 50_000,
          riskClass: "mid",
        },
      ],
    });

    expect(result.items).toHaveLength(2);
    expect(result.summary.totalGross).toBeGreaterThan(0);
    expect(result.summary.totalNet).toBeLessThan(result.summary.totalGross);
  });
});
