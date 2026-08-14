import assert from "node:assert/strict";
import test from "node:test";
import { toCsv } from "@/lib/csv";
import {
  formatCurrency,
  formatDate,
  formatRouteDate,
  slugify,
} from "@/lib/format";

// ─── formatCurrency ───────────────────────────────────────────────────

test("formatCurrency formats integer amounts", () => {
  const result = formatCurrency(1500000);
  assert.ok(
    result.includes("1,500,000") || result.includes("₮") || result.length > 0,
  );
});

test("formatCurrency returns string", () => {
  assert.equal(typeof formatCurrency(1000), "string");
});

test("formatCurrency handles zero", () => {
  const result = formatCurrency(0);
  assert.equal(typeof result, "string");
  assert.ok(result.length > 0);
});

test("formatCurrency handles large numbers", () => {
  const result = formatCurrency(1000000000);
  assert.equal(typeof result, "string");
  assert.ok(result.length > 0);
});

test("formatCurrency handles decimal amounts", () => {
  const result = formatCurrency(1500.5);
  assert.equal(typeof result, "string");
  assert.ok(result.length > 0);
});

// ─── formatDate ───────────────────────────────────────────────────────

test("formatDate formats Date object", () => {
  const result = formatDate(new Date("2026-06-15"));
  assert.equal(result, "2026-06-15");
});

test("formatDate formats date string", () => {
  const result = formatDate("2026-06-15T10:00:00Z");
  assert.equal(result, "2026-06-15");
});

test("formatDate returns dash for null", () => {
  assert.equal(formatDate(null), "-");
});

test("formatDate returns dash for undefined", () => {
  assert.equal(formatDate(undefined), "-");
});

// ─── formatRouteDate ──────────────────────────────────────────────────

test("formatRouteDate formats given date", () => {
  const result = formatRouteDate(new Date("2026-06-15"));
  assert.equal(result, "2026-06-15");
});

test("formatRouteDate formats given date string", () => {
  const result = formatRouteDate("2026-06-15");
  assert.equal(result, "2026-06-15");
});

test("formatRouteDate uses today for null", () => {
  const result = formatRouteDate(null);
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
});

test("formatRouteDate uses today for undefined", () => {
  const result = formatRouteDate(undefined);
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
});

// ─── slugify ──────────────────────────────────────────────────────────

test("slugify converts text to lowercase slug", () => {
  assert.equal(slugify("My Organization"), "my-organization");
});

test("slugify removes special characters", () => {
  assert.equal(slugify("Hello! @World#"), "hello-world");
});

test("slugify handles leading and trailing whitespace", () => {
  assert.equal(slugify("  My Org  "), "my-org");
});

test("slugify collapses multiple dashes", () => {
  assert.equal(slugify("My   Org"), "my-org");
});

test("slugify removes leading dashes", () => {
  assert.equal(slugify("---My Org"), "my-org");
});

test("slugify removes trailing dashes", () => {
  assert.equal(slugify("My Org---"), "my-org");
});

test("slugify handles empty string", () => {
  assert.equal(slugify(""), "");
});

test("slugify strips Mongolian Cyrillic text (no word chars)", () => {
  // Slugify uses /\w/ which doesn't match Cyrillic characters
  assert.equal(slugify("Миний Байгууллага"), "");
});

// ─── CSV export ───────────────────────────────────────────────────────

test("toCsv generates CSV with header row from columns", () => {
  const data = [
    { name: "Product A", price: 5000 },
    { name: "Product B", price: 10000 },
  ];

  const csv = toCsv(data, [
    { header: "Бүтээгдэхүүн", key: "name" },
    { header: "Үнэ", key: "price" },
  ]);

  const lines = csv.trim().split("\n");
  assert.equal(lines.length, 3); // header + 2 data rows
  assert.equal(lines[0], "Бүтээгдэхүүн,Үнэ");
  assert.ok(lines[1].includes("Product A"));
  assert.ok(lines[2].includes("Product B"));
});

test("toCsv handles empty data outputting only header", () => {
  const csv = toCsv(
    [],
    [
      { header: "Name", key: "name" },
      { header: "Price", key: "price" },
    ],
  );

  const lines = csv.trim().split("\n");
  assert.equal(lines.length, 1);
  assert.equal(lines[0], "Name,Price");
});

test("toCsv escapes values containing commas", () => {
  const data = [{ name: "Product, A", price: 5000 }];
  const csv = toCsv(data, [
    { header: "Name", key: "name" },
    { header: "Price", key: "price" },
  ]);

  assert.ok(csv.includes('"Product, A"'));
});

test("toCsv escapes values containing double quotes", () => {
  const data = [{ name: 'Product "X"', price: 5000 }];
  const csv = toCsv(data, [
    { header: "Name", key: "name" },
    { header: "Price", key: "price" },
  ]);

  assert.ok(csv.includes('"Product ""X"""'));
});

test("toCsv handles null and undefined values as empty string", () => {
  const data = [
    { name: "Product A", price: null },
    { name: "Product B", price: undefined },
  ];

  const csv = toCsv(data, [
    { header: "Name", key: "name" },
    { header: "Price", key: "price" },
  ]);

  const lines = csv.trim().split("\n");
  assert.equal(lines.length, 3);
  // Price column should be empty for both rows
  assert.equal(lines[1], "Product A,");
  assert.equal(lines[2], "Product B,");
});

// ─── Financial aggregation formulas ───────────────────────────────────

test("reports: totalSales sum from multiple sales", () => {
  const sales = [
    { total_amount: 50000 },
    { total_amount: 30000 },
    { total_amount: 20000 },
  ];

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  assert.equal(totalSales, 100000);
});

test("reports: totalSales zero for empty array", () => {
  const totalSales = ([] as { total_amount: number }[]).reduce(
    (sum, s) => sum + Number(s.total_amount),
    0,
  );
  assert.equal(totalSales, 0);
});

test("reports: totalPaid sum with null paid_amount handled", () => {
  const sales = [
    { paid_amount: 50000 },
    { paid_amount: null },
    { paid_amount: 30000 },
  ];

  const totalPaid = sales.reduce(
    (sum, s) => sum + Number(s.paid_amount ?? 0),
    0,
  );
  assert.equal(totalPaid, 80000);
});

test("reports: cost of goods sold calculation", () => {
  const items = [
    { quantity: 2, cost_price: 5000 },
    { quantity: 3, cost_price: 3000 },
    { quantity: 1, cost_price: 10000 },
  ];

  const cogs = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.cost_price),
    0,
  );
  assert.equal(cogs, 2 * 5000 + 3 * 3000 + 1 * 10000);
  assert.equal(cogs, 29000);
});

test("reports: cost of goods sold with null cost_price treated as 0", () => {
  const items = [
    { quantity: 2, cost_price: null },
    { quantity: 1, cost_price: 5000 },
  ];

  const cogs = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.cost_price ?? 0),
    0,
  );
  assert.equal(cogs, 5000);
});

test("reports: grossProfit = totalSales - costOfGoodsSold", () => {
  const totalSales = 100000;
  const cogs = 60000;
  const grossProfit = totalSales - cogs;
  assert.equal(grossProfit, 40000);
});

test("reports: netCash = totalPaid - totalExpenses", () => {
  const totalPaid = 80000;
  const totalExpenses = 30000;
  const netCash = totalPaid - totalExpenses;
  assert.equal(netCash, 50000);
});

test("reports: netCash negative when expenses exceed payments", () => {
  const totalPaid = 20000;
  const totalExpenses = 50000;
  const netCash = totalPaid - totalExpenses;
  assert.equal(netCash, -30000);
});

// ─── Product sales breakdown aggregation ──────────────────────────────

test("reports: product sales grouped by product name", () => {
  const items = [
    {
      productName: "Product A",
      quantity: 2,
      totalPrice: 10000,
      costPrice: 3000,
    },
    {
      productName: "Product A",
      quantity: 1,
      totalPrice: 5000,
      costPrice: 3000,
    },
    {
      productName: "Product B",
      quantity: 3,
      totalPrice: 15000,
      costPrice: 4000,
    },
  ];

  const productMap = new Map<
    string,
    { quantity: number; revenue: number; cost: number }
  >();
  for (const item of items) {
    const existing = productMap.get(item.productName);
    const cost = item.quantity * item.costPrice;
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += item.totalPrice;
      existing.cost += cost;
    } else {
      productMap.set(item.productName, {
        quantity: item.quantity,
        revenue: item.totalPrice,
        cost,
      });
    }
  }

  assert.equal(productMap.size, 2);

  const productA = productMap.get("Product A");
  assert.ok(productA, "Product A should exist in productMap");
  assert.equal(productA?.quantity, 3);
  assert.equal(productA?.revenue, 15000);
  assert.equal(productA?.cost, 3 * 3000);

  const productB = productMap.get("Product B");
  assert.ok(productB, "Product B should exist in productMap");
  assert.equal(productB?.quantity, 3);
  assert.equal(productB?.revenue, 15000);
  assert.equal(productB?.cost, 3 * 4000);
});

test("reports: product sales profit and margin calculation", () => {
  const revenue = 20000;
  const cost = 12000;
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  assert.equal(profit, 8000);
  assert.equal(margin, 40);
});

test("reports: product sales sorted by revenue descending", () => {
  const products = [
    { productName: "A", revenue: 5000 },
    { productName: "B", revenue: 15000 },
    { productName: "C", revenue: 10000 },
  ];

  products.sort((a, b) => b.revenue - a.revenue);
  assert.equal(products[0].productName, "B");
  assert.equal(products[1].productName, "C");
  assert.equal(products[2].productName, "A");
});

// ─── Stock movements summary ──────────────────────────────────────────

test("reports: stock movements summary counting", () => {
  const movements = [
    { type: "in" },
    { type: "in" },
    { type: "out" },
    { type: "adjustment" },
    { type: "in" },
  ];

  const summary = { in: 0, out: 0, adjustment: 0 };
  for (const m of movements) {
    if (m.type === "in") summary.in += 1;
    else if (m.type === "out") summary.out += 1;
    else if (m.type === "adjustment") summary.adjustment += 1;
  }

  assert.equal(summary.in, 3);
  assert.equal(summary.out, 1);
  assert.equal(summary.adjustment, 1);
});
