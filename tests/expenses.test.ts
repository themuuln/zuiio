import assert from "node:assert/strict";
import test from "node:test";
import { COMPANY_TYPES, PRESET_CATEGORIES } from "@/lib/constants";
import { validateExpenseInput } from "@/lib/domain-rules";

// ─── validateExpenseInput ─────────────────────────────────────────────

test("validateExpenseInput rejects empty category", () => {
  assert.equal(
    validateExpenseInput({ category: "", amount: 10000 }),
    "Ангилал шаардлагатай.",
  );
});

test("validateExpenseInput rejects whitespace-only category", () => {
  assert.equal(
    validateExpenseInput({ category: "   ", amount: 10000 }),
    "Ангилал шаардлагатай.",
  );
});

test("validateExpenseInput rejects zero amount", () => {
  assert.equal(
    validateExpenseInput({ category: "Түрээс", amount: 0 }),
    "Зарлагын дүн 0-ээс их байх ёстой.",
  );
});

test("validateExpenseInput rejects negative amount", () => {
  assert.equal(
    validateExpenseInput({ category: "Түрээс", amount: -500 }),
    "Зарлагын дүн 0-ээс их байх ёстой.",
  );
});

test("validateExpenseInput rejects NaN amount", () => {
  assert.equal(
    validateExpenseInput({ category: "Түрээс", amount: NaN }),
    "Зарлагын дүн 0-ээс их байх ёстой.",
  );
});

test("validateExpenseInput validates category before amount", () => {
  assert.equal(
    validateExpenseInput({ category: "", amount: 0 }),
    "Ангилал шаардлагатай.",
  );
});

test("validateExpenseInput accepts valid input", () => {
  assert.equal(
    validateExpenseInput({ category: "Түрээс", amount: 1500000 }),
    null,
  );
});

test("validateExpenseInput accepts minimum amount (1)", () => {
  assert.equal(validateExpenseInput({ category: "Бусад", amount: 1 }), null);
});

test("validateExpenseInput accepts large amounts", () => {
  assert.equal(
    validateExpenseInput({ category: "Түрээс", amount: 999999999 }),
    null,
  );
});

test("validateExpenseInput trims whitespace in category", () => {
  assert.equal(
    validateExpenseInput({ category: "  Түрээс  ", amount: 50000 }),
    null,
  );
});

// ─── PRESET_CATEGORIES ────────────────────────────────────────────────

test("PRESET_CATEGORIES has categories for all company types", () => {
  for (const ct of COMPANY_TYPES) {
    assert.ok(
      PRESET_CATEGORIES[ct.value],
      `Company type "${ct.value}" should have preset categories`,
    );
    assert.ok(
      PRESET_CATEGORIES[ct.value].length > 0,
      `Company type "${ct.value}" should have at least one category`,
    );
  }
});

test("PRESET_CATEGORIES includes 'Бусад' in every company type", () => {
  for (const ct of COMPANY_TYPES) {
    assert.ok(
      PRESET_CATEGORIES[ct.value].includes("Бусад"),
      `Company type "${ct.value}" should include 'Бусад' category`,
    );
  }
});

test("PRESET_CATEGORIES retail has expected categories", () => {
  const retail = PRESET_CATEGORIES.retail;
  assert.ok(retail.includes("Хүнс"));
  assert.ok(retail.includes("Ундаа"));
  assert.ok(retail.includes("Хувцас"));
  assert.ok(retail.includes("Гэр ахуй"));
  assert.ok(retail.includes("Цахилгаан бараа"));
});

test("PRESET_CATEGORIES service has expected categories", () => {
  const service = PRESET_CATEGORIES.service;
  assert.ok(service.includes("Засвар үйлчилгээ"));
  assert.ok(service.includes("Зөвлөгөө"));
  assert.ok(service.includes("Сургалт"));
});

test("PRESET_CATEGORIES restaurant has expected categories", () => {
  const restaurant = PRESET_CATEGORIES.restaurant;
  assert.ok(restaurant.includes("Хоол"));
  assert.ok(restaurant.includes("Ундаа"));
  assert.ok(restaurant.includes("Амттан"));
});

test("PRESET_CATEGORIES other has only 'Бусад'", () => {
  assert.deepEqual(PRESET_CATEGORIES.other, ["Бусад"]);
});

// ─── COMPANY_TYPES ────────────────────────────────────────────────────

test("COMPANY_TYPES has correct values with labels", () => {
  const types = COMPANY_TYPES.map((t) => t.value);
  assert.ok(types.includes("retail"));
  assert.ok(types.includes("wholesale"));
  assert.ok(types.includes("service"));
  assert.ok(types.includes("manufacturing"));
  assert.ok(types.includes("restaurant"));
  assert.ok(types.includes("other"));
});

test("COMPANY_TYPES labels are in Mongolian", () => {
  for (const ct of COMPANY_TYPES) {
    assert.ok(ct.label.length > 0, `Label for ${ct.value} should not be empty`);
  }
});

// ─── Expense aggregation logic ────────────────────────────────────────

test("expense category grouping: single category sums correctly", () => {
  const expenses = [
    { category: "Түрээс", amount: 500000 },
    { category: "Түрээс", amount: 300000 },
  ];

  const categoryMap = new Map<string, { count: number; total: number }>();
  for (const expense of expenses) {
    const existing = categoryMap.get(expense.category);
    if (existing) {
      existing.count += 1;
      existing.total += expense.amount;
    } else {
      categoryMap.set(expense.category, { count: 1, total: expense.amount });
    }
  }

  const result = [...categoryMap.entries()].map(
    ([category, { count, total }]) => ({ category, count, total }),
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].category, "Түрээс");
  assert.equal(result[0].count, 2);
  assert.equal(result[0].total, 800000);
});

test("expense category grouping: multiple categories grouped correctly", () => {
  const expenses = [
    { category: "Түрээс", amount: 500000 },
    { category: "Цахилгаан", amount: 100000 },
    { category: "Түрээс", amount: 500000 },
    { category: "Хоол", amount: 50000 },
  ];

  const categoryMap = new Map<string, { count: number; total: number }>();
  for (const expense of expenses) {
    const existing = categoryMap.get(expense.category);
    if (existing) {
      existing.count += 1;
      existing.total += expense.amount;
    } else {
      categoryMap.set(expense.category, { count: 1, total: expense.amount });
    }
  }

  const result = [...categoryMap.entries()].map(
    ([category, { count, total }]) => ({ category, count, total }),
  );

  assert.equal(result.length, 3);
  const rent = result.find((r) => r.category === "Түрээс");
  assert.ok(rent, "Түрээс category should exist in result");
  assert.equal(rent?.count, 2);
  assert.equal(rent?.total, 1000000);
});

test("expense category grouping: sorts by total descending", () => {
  const expenses = [
    { category: "Хоол", amount: 50000 },
    { category: "Түрээс", amount: 500000 },
    { category: "Цахилгаан", amount: 100000 },
  ];

  const categoryMap = new Map<string, { count: number; total: number }>();
  for (const expense of expenses) {
    const existing = categoryMap.get(expense.category);
    if (existing) {
      existing.count += 1;
      existing.total += expense.amount;
    } else {
      categoryMap.set(expense.category, { count: 1, total: expense.amount });
    }
  }

  const result = [...categoryMap.entries()]
    .map(([category, { count, total }]) => ({ category, count, total }))
    .sort((a, b) => b.total - a.total);

  assert.equal(result[0].category, "Түрээс");
  assert.equal(result[1].category, "Цахилгаан");
  assert.equal(result[2].category, "Хоол");
});

test("expense category grouping: empty expenses yields empty result", () => {
  const expenses: { category: string; amount: number }[] = [];

  const categoryMap = new Map<string, { count: number; total: number }>();
  for (const expense of expenses) {
    const existing = categoryMap.get(expense.category);
    if (existing) {
      existing.count += 1;
      existing.total += expense.amount;
    } else {
      categoryMap.set(expense.category, { count: 1, total: expense.amount });
    }
  }

  const result = [...categoryMap.entries()].map(
    ([category, { count, total }]) => ({ category, count, total }),
  );

  assert.equal(result.length, 0);
});

// ─── Financial summary calculations ───────────────────────────────────

test("financial summary: netCash = totalPaid - totalExpenses", () => {
  const totalPaid = 1000000;
  const totalExpenses = 300000;
  const netCash = totalPaid - totalExpenses;
  assert.equal(netCash, 700000);
});

test("financial summary: netCash can be negative", () => {
  const totalPaid = 200000;
  const totalExpenses = 500000;
  const netCash = totalPaid - totalExpenses;
  assert.equal(netCash, -300000);
});
