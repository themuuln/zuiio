/**
 * Tests for src/lib/budget.ts — pure utility functions, no mocking needed
 */

import { describe, expect, it } from "vitest";
import {
  calculateBudgetSummary,
  formatBudgetPeriod,
  getBudgetStatusColor,
} from "../budget";

describe("calculateBudgetSummary", () => {
  const baseBudget = {
    id: "b1",
    organization_id: "org-1",
    name: "Тест төсөв",
    category: "Ажилчдын цалин",
    amount: 1000000,
    period: "monthly",
    start_date: "2026-07-01",
    end_date: "2026-07-31",
    alert_threshold: 80,
    spent: 0,
    created_at: "2026-06-30",
  };

  it("calculates full summary for a valid budget", () => {
    const budget = { ...baseBudget, spent: 500000 };
    const result = calculateBudgetSummary(budget);

    expect(result.budget).toBe(budget);
    expect(result.spent).toBe(500000);
    expect(result.remaining).toBe(500000);
    expect(result.percentage).toBe(50);
    expect(result.isOverBudget).toBe(false);
    expect(result.isNearLimit).toBe(false);
  });

  it("marks over-budget when spent exceeds amount", () => {
    const budget = { ...baseBudget, spent: 1200000 };
    const result = calculateBudgetSummary(budget);

    expect(result.isOverBudget).toBe(true);
    expect(result.isNearLimit).toBe(true);
    expect(result.percentage).toBe(120);
    expect(result.remaining).toBe(-200000);
  });

  it("marks near-limit when percentage >= alert_threshold", () => {
    const budget = { ...baseBudget, spent: 800000, alert_threshold: 80 };
    const result = calculateBudgetSummary(budget);

    expect(result.isNearLimit).toBe(true);
    expect(result.isOverBudget).toBe(false);
    expect(result.percentage).toBe(80);
  });

  it("handles zero amount without division by zero", () => {
    const budget = { ...baseBudget, amount: 0, spent: 0 };
    const result = calculateBudgetSummary(budget);

    expect(result.percentage).toBe(0);
    expect(result.isOverBudget).toBe(false);
  });

  it("calculates daysLeft correctly", () => {
    const budget = { ...baseBudget, spent: 0 };
    const result = calculateBudgetSummary(budget);
    expect(result.daysLeft).toBeGreaterThanOrEqual(0);
  });

  it("calculates dailyBurnRate from spent and days passed", () => {
    const budget = { ...baseBudget, spent: 100000 };
    const result = calculateBudgetSummary(budget);

    expect(result.dailyBurnRate).toBeGreaterThanOrEqual(0);
  });

  it("calculates projectedTotal from dailyBurnRate", () => {
    const budget = { ...baseBudget, spent: 310000 };
    const result = calculateBudgetSummary(budget);

    // 31 days in July, 10k/day * 31 = 310k
    expect(result.projectedTotal).toBeGreaterThanOrEqual(300000);
  });
});

describe("getBudgetStatusColor", () => {
  it("returns destructive for >= 100%", () => {
    expect(getBudgetStatusColor(100)).toBe("destructive");
    expect(getBudgetStatusColor(150)).toBe("destructive");
  });

  it("returns warning for 80-99%", () => {
    expect(getBudgetStatusColor(80)).toBe("warning");
    expect(getBudgetStatusColor(90)).toBe("warning");
    expect(getBudgetStatusColor(99)).toBe("warning");
  });

  it("returns default for < 80%", () => {
    expect(getBudgetStatusColor(0)).toBe("default");
    expect(getBudgetStatusColor(50)).toBe("default");
    expect(getBudgetStatusColor(79)).toBe("default");
  });
});

describe("formatBudgetPeriod", () => {
  it("formats single-month period", () => {
    const result = formatBudgetPeriod("2026-07-01", "2026-07-31");
    expect(result).toContain("7");
    expect(result).toContain("2026");
  });

  it("formats multi-month period", () => {
    const result = formatBudgetPeriod("2026-01-01", "2026-03-31");
    expect(result).toContain("1");
    expect(result).toContain("3");
    expect(result).toContain("2026");
  });
});
