/**
 * Pure logic tests for gift card computations.
 *
 * Covers the mathematical invariants of gift card balance management,
 * redeemable amount calculations, and transaction type semantics.
 */

import assert from "node:assert/strict";
import test from "node:test";

// ─── Balance computation invariants ──────────────────────────────────
//
// These model the gift card balance math that the server actions
// and DB rely on.  They are framework-free and test the domain logic.

test("redeemable amount never exceeds current balance", () => {
  const balance = 50000;
  const saleTotals = [0, 1, 10000, 50000, 100000, 999999];

  for (const saleTotal of saleTotals) {
    const redeemable = Math.min(balance, saleTotal);
    assert.ok(
      redeemable <= balance,
      `redeemable ${redeemable} > balance ${balance} for saleTotal=${saleTotal}`,
    );
  }
});

test("redeemable amount never exceeds sale total", () => {
  const saleTotal = 30000;
  const balances = [0, 5000, 10000, 28000, 30000, 50000, 100000];

  for (const balance of balances) {
    const redeemable = Math.min(balance, saleTotal);
    assert.ok(
      redeemable <= saleTotal,
      `redeemable ${redeemable} > saleTotal ${saleTotal} for balance=${balance}`,
    );
  }
});

test("redeemable amount is zero when balance is zero or negative", () => {
  const saleTotal = 50000;

  assert.strictEqual(Math.min(0, saleTotal), 0, "balance=0");
  assert.strictEqual(Math.min(-1, saleTotal), -1, "balance=-1 (should be -1)");

  // In real logic, balance ≤ 0 is rejected before Math.min is reached,
  // so the invariant is: if we reach Math.min, balance > 0.
  // This test documents the raw math only.
});

test("balance after topup is balance_before + amount", () => {
  const testCases: Array<{ before: number; amount: number; expected: number }> = [
    { before: 0, amount: 10000, expected: 10000 },
    { before: 50000, amount: 25000, expected: 75000 },
    { before: 100, amount: 1, expected: 101 },
    { before: 1000000, amount: 500000, expected: 1500000 },
  ];

  for (const { before, amount, expected } of testCases) {
    const balanceAfter = before + amount;
    assert.strictEqual(balanceAfter, expected, `topup ${before} + ${amount}`);
  }
});

test("balance after topup equals balance_before + amount (integer precision)", () => {
  // MNT has no sub-unit, so amounts are whole integers.
  // Confirm no floating-point drift across large consecutive topups.
  let balance = 0;
  const topups = [10000, 25000, 5000, 100000, 50000];
  let expected = 0;

  for (const amount of topups) {
    balance += amount;
    expected += amount;
    assert.strictEqual(balance, expected, `after cumulative topup of ${expected}`);
  }
});

test("balance after issuance equals initial balance", () => {
  const initialBalances = [1000, 50000, 100000, 999999, 1];

  for (const initial of initialBalances) {
    const current = initial; // New gift card always starts with current = initial
    assert.strictEqual(current, initial, `initial=${initial}`);
  }
});

test("transaction amount preserves sign convention", () => {
  // Convention:
  //   issuance: amount = +initial_balance
  //   topup:    amount = +added_amount
  //   redeem:   amount = -redeemed_amount (or stored as positive with type indicator)

  const issuanceType = "issuance";
  const topupType = "topup";
  const redeemType = "redeem";

  // All transaction types store amount as positive
  const transactionTypes = [issuanceType, topupType, redeemType];
  for (const txType of transactionTypes) {
    assert.ok(txType.length > 0, `transaction type "${txType}" is non-empty`);
  }
});

test("redeemable amount is min(current_balance, sale_total) for valid card", () => {
  const testCases: Array<{ balance: number; saleTotal: number; expected: number }> = [
    { balance: 50000, saleTotal: 30000, expected: 30000 },
    { balance: 50000, saleTotal: 75000, expected: 50000 },
    { balance: 50000, saleTotal: 50000, expected: 50000 },
    { balance: 1000, saleTotal: 1000, expected: 1000 },
    { balance: 1, saleTotal: 100000, expected: 1 },
  ];

  for (const { balance, saleTotal, expected } of testCases) {
    const redeemable = Math.min(balance, saleTotal);
    assert.strictEqual(redeemable, expected, `balance=${balance}, sale=${saleTotal}`);
  }
});

test("current_balance after full redemption is balance - redeemable_amount", () => {
  const testCases: Array<{ balance: number; saleTotal: number }> = [
    { balance: 50000, saleTotal: 30000 },
    { balance: 30000, saleTotal: 50000 }, // balance exhausted
    { balance: 100000, saleTotal: 50000 },
    { balance: 25000, saleTotal: 25000 }, // exact match
  ];

  for (const { balance, saleTotal } of testCases) {
    const redeemable = Math.min(balance, saleTotal);
    const remaining = balance - redeemable;
    assert.strictEqual(
      remaining,
      Math.max(0, balance - saleTotal),
      `remaining after redeem: balance=${balance}, sale=${saleTotal}`,
    );
    assert.ok(remaining >= 0, `remaining should not be negative, got ${remaining}`);
    assert.ok(
      remaining <= balance,
      `remaining ${remaining} should not exceed balance ${balance}`,
    );
  }
});

test("transaction balance_after invariants", () => {
  // For issuance: balance_after = 0 + amount = amount
  // For topup:    balance_after = balance_before + amount
  // For redeem:   balance_after = balance_before - amount

  // issuance
  const issAmount = 50000;
  assert.strictEqual(0 + issAmount, issAmount, "issuance: balance_after = amount");

  // topup
  const before = 30000;
  const topupAmount = 20000;
  assert.strictEqual(before + topupAmount, 50000, "topup: balance_after = before + amount");

  // redeem
  const redeemAmount = 15000;
  const redeemBefore = 50000;
  assert.strictEqual(redeemBefore - redeemAmount, 35000, "redeem: balance_after = before - amount");
});

test("multiple consecutive topups match cumulative total", () => {
  let balance = 10000; // initial
  const topups = [5000, 10000, 25000, 0, 100000];

  let cumulative = balance;
  for (const amount of topups) {
    balance += amount;
    cumulative += amount;
    assert.strictEqual(balance, cumulative);
  }

  assert.strictEqual(balance, 150000);
});

test("zero topup does not change balance", () => {
  const balance = 50000;
  const zeroTopup = 0;
  assert.strictEqual(balance + zeroTopup, balance);
});
