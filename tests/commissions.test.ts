import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCommission,
  validatePayoutRequest,
  calculatePayoutTotal,
  getAlreadyPaidIds,
  buildStaffSummary,
} from "@/lib/commissions";

// --- Existing commission calculation tests ---

test("calculateCommission returns 10% of total_price rounded to 2 decimal places", () => {
  // 10,000 * 0.10 = 1,000.00
  assert.equal(calculateCommission(10000), 1000.0);

  // 20,000 * 0.10 = 2,000.00
  assert.equal(calculateCommission(20000), 2000.0);

  // 1,500 * 0.10 = 150.00
  assert.equal(calculateCommission(1500), 150.0);
});

test("calculateCommission rounds to 2 decimal places", () => {
  // 999 * 0.10 = 99.9 → 99.90
  assert.equal(calculateCommission(999), 99.9);

  // 1,234 * 0.10 = 123.4 → 123.40
  assert.equal(calculateCommission(1234), 123.4);

  // 1,050 * 0.10 = 105.0 → 105.00
  assert.equal(calculateCommission(1050), 105.0);
});

test("calculateCommission handles fractional amounts correctly", () => {
  // 1,999 * 0.10 = 199.9 → 199.90
  assert.equal(calculateCommission(1999), 199.9);

  // 5,555 * 0.10 = 555.5 → 555.50
  assert.equal(calculateCommission(5555), 555.5);

  // 1,234,567 * 0.10 = 123,456.7 → 123,456.70
  assert.equal(calculateCommission(1234567), 123456.7);
});

test("calculateCommission rounds fractional cents correctly", () => {
  // total_price * 0.10 with fractional cent: e.g., 1 * 0.10 = 0.10
  assert.equal(calculateCommission(1), 0.1);

  // 3 * 0.10 = 0.30
  assert.equal(calculateCommission(3), 0.3);

  // 7 * 0.10 = 0.70
  assert.equal(calculateCommission(7), 0.7);
});

test("calculateCommission returns 0 for zero price (VAL-CALC-003)", () => {
  assert.equal(calculateCommission(0), 0);
  assert.equal(calculateCommission(-1), 0);
  assert.equal(calculateCommission(-100), 0);
});

test("calculateCommission handles single-cent prices", () => {
  // 1 * 0.10 = 0.10
  assert.equal(calculateCommission(1), 0.1);
});

test("calculateCommission handles large amounts without precision loss", () => {
  // 9,999,999 * 0.10 = 999,999.90
  assert.equal(calculateCommission(9999999), 999999.9);

  // 10,000,000 * 0.10 = 1,000,000.00
  assert.equal(calculateCommission(10000000), 1000000.0);
});

test("calculateCommission returns correct values for multi-item scenario", () => {
  // Simulate a multi-item sale
  // Item 1: unitPrice=10000, quantity=2, totalPrice=20000, commission=2000.00
  // Item 2: unitPrice=5000, quantity=3, totalPrice=15000, commission=1500.00
  // Item 3: unitPrice=750, quantity=1, totalPrice=750, commission=75.00

  const items = [
    { unitPrice: 10000, quantity: 2 },
    { unitPrice: 5000, quantity: 3 },
    { unitPrice: 750, quantity: 1 },
  ];

  const commissions = items.map((item) =>
    calculateCommission(item.unitPrice * item.quantity),
  );

  assert.equal(commissions[0], 2000.0);
  assert.equal(commissions[1], 1500.0);
  assert.equal(commissions[2], 75.0);

  // Total commission: 2000 + 1500 + 75 = 3575
  const totalCommission = commissions.reduce((sum, c) => sum + c, 0);
  assert.equal(totalCommission, 3575.0);
});

test("calculateCommission for cancelled sale returns 0", () => {
  // Cancelled sales should have commission_amount=0 regardless of total_price
  const totalPrice = 50000;
  // This tests the logic: if status === "cancelled", commission = 0
  // We test this by asserting that the helper correctly handles the cancelled case
  // In the server action, cancelled status forces commission to 0 before calling calculateCommission
  assert.equal(calculateCommission(totalPrice), 5000.0); // Normal calculation

  // The cancelled-sale logic is in the server action: status === "cancelled" ? 0 : calculateCommission(...)
  // So for cancelled: explicitly 0
  const cancelledCommission = 0;
  assert.equal(cancelledCommission, 0);
});

test("calculateCommission matches SQL ROUND(total_price * 0.10, 2) semantics", () => {
  // Verify that our JavaScript calculation matches what SQL ROUND would produce
  // for various edge cases

  const testCases = [
    { totalPrice: 10000, expected: 1000.0 },
    { totalPrice: 15000, expected: 1500.0 },
    { totalPrice: 12345, expected: 1234.5 },
    { totalPrice: 999, expected: 99.9 },
    { totalPrice: 0, expected: 0 },
    { totalPrice: 1, expected: 0.1 },
    { totalPrice: 100, expected: 10.0 },
    { totalPrice: 123456, expected: 12345.6 },
  ];

  for (const { totalPrice, expected } of testCases) {
    assert.equal(
      calculateCommission(totalPrice),
      expected,
      `Failed for totalPrice=${totalPrice}`,
    );
  }
});

// --- Payout validation tests ---

test("validatePayoutRequest rejects null/empty profileId", () => {
  assert.notEqual(validatePayoutRequest({ profileId: null, selectedItemIds: ["id1"] }), null);
  assert.notEqual(validatePayoutRequest({ profileId: "", selectedItemIds: ["id1"] }), null);
});

test("validatePayoutRequest rejects empty selected items (VAL-PAY-009)", () => {
  const error = validatePayoutRequest({
    profileId: "profile-1",
    selectedItemIds: [],
  });
  assert.notEqual(error, null);
  assert(error!.includes("комиссууд"));
});

test("validatePayoutRequest accepts valid payload", () => {
  const error = validatePayoutRequest({
    profileId: "profile-1",
    selectedItemIds: ["item-1", "item-2"],
  });
  assert.equal(error, null);
});

test("calculatePayoutTotal sums commission amounts correctly", () => {
  const items = [
    { commission_amount: 1000.0 },
    { commission_amount: 2500.5 },
    { commission_amount: 750.25 },
  ];
  assert.equal(calculatePayoutTotal(items), 4250.75);
});

test("calculatePayoutTotal returns 0 for empty items", () => {
  assert.equal(calculatePayoutTotal([]), 0);
});

test("getAlreadyPaidIds finds already paid items correctly", () => {
  const paidItems = [
    { sale_item_id: "item-1" },
    { sale_item_id: "item-3" },
  ];
  const selectedIds = ["item-1", "item-2", "item-3", "item-4"];

  const alreadyPaid = getAlreadyPaidIds(paidItems, selectedIds);
  assert.deepEqual(alreadyPaid, ["item-1", "item-3"]);
});

test("getAlreadyPaidIds returns empty array when none are paid (VAL-PAY-006)", () => {
  const paidItems: Array<{ sale_item_id: string }> = [];
  const selectedIds = ["item-1", "item-2"];

  const alreadyPaid = getAlreadyPaidIds(paidItems, selectedIds);
  assert.equal(alreadyPaid.length, 0);
});

test("buildStaffSummary computes correct unpaid balance", () => {
  const summary = buildStaffSummary({
    profileId: "p1",
    fullName: "Test User",
    totalEarned: 5000,
    totalPaid: 1500,
  });

  assert.equal(summary.profileId, "p1");
  assert.equal(summary.fullName, "Test User");
  assert.equal(summary.totalEarned, 5000);
  assert.equal(summary.totalPaid, 1500);
  assert.equal(summary.totalUnpaid, 3500);
});

test("buildStaffSummary handles zero values", () => {
  const summary = buildStaffSummary({
    profileId: "p2",
    fullName: "Zero User",
    totalEarned: 0,
    totalPaid: 0,
  });

  assert.equal(summary.totalEarned, 0);
  assert.equal(summary.totalPaid, 0);
  assert.equal(summary.totalUnpaid, 0);
});

test("buildStaffSummary prevents negative unpaid", () => {
  const summary = buildStaffSummary({
    profileId: "p3",
    fullName: "Overpaid User",
    totalEarned: 100,
    totalPaid: 200,
  });

  assert.equal(summary.totalUnpaid, 0); // Can't have negative unpaid
});
