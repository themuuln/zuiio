import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBudgetSummary,
  getBudgetStatusColor,
  formatBudgetPeriod,
  type Budget,
} from "@/lib/budget";

// --- helpers: dates relative to "now" so dayLeft / dailyBurnRate stay deterministic ---

const now = new Date();
const MS_PER_DAY = 86_400_000;
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * MS_PER_DAY).toISOString().slice(0, 10);
const daysFromNow = (d: number) =>
  new Date(now.getTime() + d * MS_PER_DAY).toISOString().slice(0, 10);

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "b1",
  organization_id: "org1",
  name: "Test Budget",
  category: null,
  amount: 1000,
  period: "monthly",
  start_date: daysAgo(15),
  end_date: daysFromNow(15),
  alert_threshold: 80,
  spent: 0,
  created_at: "2025-01-01",
  ...overrides,
});

// ================================================================
// calculateBudgetSummary
// ================================================================

test("under budget: remaining > 0, percentage < 100, isOverBudget false", () => {
  const budget = makeBudget({ amount: 1000, spent: 400 });
  const s = calculateBudgetSummary(budget);

  assert.equal(s.spent, 400);
  assert.equal(s.remaining, 600);
  assert.ok(s.percentage < 100, `percentage ${s.percentage} should be < 100`);
  assert.equal(s.isOverBudget, false);
  assert.equal(s.isNearLimit, false); // 40% < 80 threshold
  assert.ok(s.daysLeft >= 0);
  assert.ok(s.dailyBurnRate >= 0);
  assert.ok(s.projectedTotal >= 0);
});

test("exactly at budget: percentage 100, isOverBudget false, isNearLimit respects threshold", () => {
  const budget = makeBudget({ amount: 1000, spent: 1000, alert_threshold: 80 });
  const s = calculateBudgetSummary(budget);

  assert.equal(s.remaining, 0);
  assert.equal(s.percentage, 100);
  assert.equal(s.isOverBudget, false);
  // 100 >= 80 → near limit
  assert.equal(s.isNearLimit, true);

  // with a high threshold that is NOT met
  const strict = makeBudget({ amount: 1000, spent: 1000, alert_threshold: 999 });
  const s2 = calculateBudgetSummary(strict);
  assert.equal(s2.isNearLimit, false); // 100 < 999
});

test("over budget: percentage > 100, isOverBudget true, remaining negative", () => {
  const budget = makeBudget({ amount: 1000, spent: 1350 });
  const s = calculateBudgetSummary(budget);

  assert.equal(s.remaining, -350);
  assert.ok(s.percentage > 100, `percentage ${s.percentage} should be > 100`);
  assert.equal(s.percentage, 135);
  assert.equal(s.isOverBudget, true);
  assert.equal(s.isNearLimit, true); // 135 >= 80
});

test("zero budget amount: percentage 0, no division by zero", () => {
  const budget = makeBudget({ amount: 0, spent: 0 });
  const s = calculateBudgetSummary(budget);

  assert.equal(s.percentage, 0);
  assert.equal(s.remaining, 0);
  assert.equal(s.isOverBudget, false);
  assert.ok(Number.isFinite(s.dailyBurnRate));
  assert.ok(Number.isFinite(s.projectedTotal));
});

// ================================================================
// getBudgetStatusColor
// ================================================================

test("percentage >= 100 → destructive", () => {
  assert.equal(getBudgetStatusColor(100), "destructive");
  assert.equal(getBudgetStatusColor(150), "destructive");
  assert.equal(getBudgetStatusColor(99.9), "warning"); // boundary just below
});

test("percentage 80–99 → warning", () => {
  assert.equal(getBudgetStatusColor(80), "warning");
  assert.equal(getBudgetStatusColor(99), "warning");
  assert.equal(getBudgetStatusColor(79.9), "default"); // boundary just below
});

test("percentage < 80 → default", () => {
  assert.equal(getBudgetStatusColor(0), "default");
  assert.equal(getBudgetStatusColor(50), "default");
  assert.equal(getBudgetStatusColor(79), "default");
});

// ================================================================
// formatBudgetPeriod
// ================================================================

test("same month: no dash separator", () => {
  const result = formatBudgetPeriod("2025-06-01", "2025-06-30");
  assert.ok(!result.includes(" - "), `expected no dash, got: ${result}`);
  assert.ok(result.includes("2025"), `expected year 2025 in: ${result}`);
});

test("different months: dash separator present", () => {
  const result = formatBudgetPeriod("2025-01-15", "2025-04-15");
  assert.ok(result.includes(" - "), `expected dash separator, got: ${result}`);
  assert.ok(result.includes("2025"), `expected year 2025 in: ${result}`);
});

test("same month different years: no dash, uses start year", () => {
  const result = formatBudgetPeriod("2024-06-01", "2025-06-30");
  // Same short month name → no separator
  assert.ok(!result.includes(" - "), `expected no dash, got: ${result}`);
  assert.ok(result.includes("2024"), `expected start year 2024 in: ${result}`);
});
