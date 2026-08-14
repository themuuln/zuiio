import assert from "node:assert/strict";
import test from "node:test";
import {
  discountSchema,
  expenseSchema,
  purchaseSchema,
  quotationSchema,
} from "../src/lib/validation-schemas";

// ─── expenseSchema ──────────────────────────────────────────────────

test("expenseSchema: valid data passes", () => {
  const result = expenseSchema.safeParse({
    category: "Хоол хүнс",
    amount: 15000,
    expense_date: "2025-07-14",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.category, "Хоол хүнс");
  assert.equal(result.data?.amount, 15000);
  assert.equal(result.data?.payment_method, "cash"); // default
});

test("expenseSchema: empty category fails with Mongolian message", () => {
  const result = expenseSchema.safeParse({
    category: "",
    amount: 1000,
    expense_date: "2025-07-14",
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("category"));
  assert.ok(issue, "expected category issue");
  assert.equal(issue.message, "Ангилал шаардлагатай");
});

test("expenseSchema: missing required fields fails", () => {
  const result = expenseSchema.safeParse({});
  assert.equal(result.success, false);
  assert.ok(result.error.issues.length >= 2, "expected at least 2 issues");
});

test("expenseSchema: zero amount fails", () => {
  const result = expenseSchema.safeParse({
    category: "Захиргаа",
    amount: 0,
    expense_date: "2025-07-14",
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("amount"));
  assert.ok(issue, "expected amount issue");
});

test("expenseSchema: negative amount fails", () => {
  const result = expenseSchema.safeParse({
    category: "Захиргаа",
    amount: -500,
    expense_date: "2025-07-14",
  });
  assert.equal(result.success, false);
});

test("expenseSchema: empty expense_date fails with Mongolian message", () => {
  const result = expenseSchema.safeParse({
    category: "Тээвэр",
    amount: 3000,
    expense_date: "",
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) =>
    i.path.includes("expense_date"),
  );
  assert.ok(issue, "expected expense_date issue");
  assert.equal(issue.message, "Огноо шаардлагатай");
});

test("expenseSchema: valid data with optional fields passes", () => {
  const result = expenseSchema.safeParse({
    category: "Хоол хүнс",
    amount: 25000,
    expense_date: "2025-07-14",
    description: "Буянт-Ухаа агуулахын тээвэр",
    payment_method: "transfer",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.description, "Буянт-Ухаа агуулахын тээвэр");
  assert.equal(result.data?.payment_method, "transfer");
});

test("expenseSchema: amount coerced from string '5000' (FormData)", () => {
  const result = expenseSchema.safeParse({
    category: "Зочид буудал",
    amount: "5000",
    expense_date: "2025-07-14",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.amount, 5000);
});

// ─── discountSchema ─────────────────────────────────────────────────

test("discountSchema: valid percentage discount passes", () => {
  const result = discountSchema.safeParse({
    name: "Цагаан сарын хямдрал",
    type: "percentage",
    value: 10,
    applies_to: "all",
    valid_from: "2025-01-01",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.type, "percentage");
  assert.equal(result.data?.value, 10);
  assert.equal(result.data?.is_active, true); // default
});

test("discountSchema: valid fixed_amount discount passes", () => {
  const result = discountSchema.safeParse({
    name: "Тогтмол хямдрал",
    type: "fixed_amount",
    value: 5000,
    applies_to: "selected_products",
    valid_from: "2025-06-01",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.type, "fixed_amount");
});

test("discountSchema: empty name fails with Mongolian message", () => {
  const result = discountSchema.safeParse({
    name: "",
    type: "percentage",
    value: 5,
    applies_to: "all",
    valid_from: "2025-01-01",
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("name"));
  assert.ok(issue, "expected name issue");
  assert.equal(issue.message, "Нэр шаардлагатай");
});

test("discountSchema: invalid type fails with Mongolian message", () => {
  const result = discountSchema.safeParse({
    name: "Алдаатай төрөл",
    type: "buy_one_get_one",
    value: 10,
    applies_to: "all",
    valid_from: "2025-01-01",
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("type"));
  assert.ok(issue, "expected type issue");
  assert.equal(issue.message, "Хямдралын төрөл буруу байна");
});

test("discountSchema: zero value fails", () => {
  const result = discountSchema.safeParse({
    name: "Тэг утга",
    type: "percentage",
    value: 0,
    applies_to: "all",
    valid_from: "2025-01-01",
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("value"));
  assert.ok(issue, "expected value issue");
});

test("discountSchema: is_active from string 'true' coerces to boolean true", () => {
  const result = discountSchema.safeParse({
    name: "Идэвхтэй",
    type: "percentage",
    value: 15,
    applies_to: "all",
    valid_from: "2025-01-01",
    is_active: "true",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.is_active, true);
});

test("discountSchema: is_active from string 'false' coerces to boolean false", () => {
  const result = discountSchema.safeParse({
    name: "Идэвхгүй",
    type: "percentage",
    value: 15,
    applies_to: "all",
    valid_from: "2025-01-01",
    is_active: "false",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.is_active, false);
});

test("discountSchema: is_active as boolean true works", () => {
  const result = discountSchema.safeParse({
    name: "Boolean утга",
    type: "fixed_amount",
    value: 2000,
    applies_to: "selected_categories",
    valid_from: "2025-01-01",
    is_active: true,
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.is_active, true);
});

test("discountSchema: empty valid_from fails with Mongolian message", () => {
  const result = discountSchema.safeParse({
    name: "Огноогүй",
    type: "percentage",
    value: 5,
    applies_to: "all",
    valid_from: "",
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("valid_from"));
  assert.ok(issue, "expected valid_from issue");
  assert.equal(issue.message, "Хүчинтэй эхлэх огноо шаардлагатай");
});

// ─── purchaseSchema ─────────────────────────────────────────────────

test("purchaseSchema: valid data with items JSON passes", () => {
  const result = purchaseSchema.safeParse({
    supplier_id: "sup-001",
    order_date: "2025-07-14",
    items: JSON.stringify([{ product_id: "p-1", quantity: 10, cost: 2500 }]),
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.supplier_id, "sup-001");
});

test("purchaseSchema: empty items array fails", () => {
  const result = purchaseSchema.safeParse({
    order_date: "2025-07-14",
    items: JSON.stringify([]),
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("items"));
  assert.ok(issue, "expected items issue");
  assert.equal(issue.message, "Барааны мэдээлэл шаардлагатай");
});

test("purchaseSchema: invalid JSON items fails", () => {
  const result = purchaseSchema.safeParse({
    order_date: "2025-07-14",
    items: "not-json",
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("items"));
  assert.ok(issue, "expected items issue");
});

test("purchaseSchema: empty order_date fails with Mongolian message", () => {
  const result = purchaseSchema.safeParse({
    order_date: "",
    items: JSON.stringify([{ product_id: "p-1", quantity: 5, cost: 1000 }]),
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("order_date"));
  assert.ok(issue, "expected order_date issue");
  assert.equal(issue.message, "Огноо шаардлагатай");
});

// ─── quotationSchema ────────────────────────────────────────────────

test("quotationSchema: valid data passes", () => {
  const result = quotationSchema.safeParse({
    contact_id: "c-42",
    issue_date: "2025-07-14",
    items: JSON.stringify([{ product_id: "p-10", quantity: 3, price: 50000 }]),
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.contact_id, "c-42");
});

test("quotationSchema: empty items fails", () => {
  const result = quotationSchema.safeParse({
    issue_date: "2025-07-14",
    items: JSON.stringify([]),
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("items"));
  assert.ok(issue, "expected items issue");
  assert.equal(issue.message, "Барааны мэдээлэл шаардлагатай");
});

test("quotationSchema: empty issue_date fails with Mongolian message", () => {
  const result = quotationSchema.safeParse({
    issue_date: "",
    items: JSON.stringify([{ product_id: "p-1", quantity: 1, price: 1000 }]),
  });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path.includes("issue_date"));
  assert.ok(issue, "expected issue_date issue");
  assert.equal(issue.message, "Огноо шаардлагатай");
});

test("quotationSchema: valid data with optional fields passes", () => {
  const result = quotationSchema.safeParse({
    contact_id: "c-99",
    issue_date: "2025-07-14",
    expiry_date: "2025-08-14",
    notes: "Хүчинтэй хугацаа 1 сар",
    items: JSON.stringify([
      { product_id: "p-1", quantity: 2, price: 30000 },
      { product_id: "p-5", quantity: 1, price: 120000 },
    ]),
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.expiry_date, "2025-08-14");
  assert.equal(result.data?.notes, "Хүчинтэй хугацаа 1 сар");
});
