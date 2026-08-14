/**
 * Tests for src/lib/commissions.ts — pure functions, no mocking needed
 */
import { describe, expect, it } from "vitest";
import {
  buildStaffSummary,
  calculateCommission,
  calculatePayoutTotal,
  getAlreadyPaidIds,
  validatePayoutRequest,
} from "../commissions";

describe("calculateCommission", () => {
  it("returns 10% of total price, rounded to 2 decimal places", () => {
    expect(calculateCommission(10000)).toBe(1000);
    expect(calculateCommission(1500)).toBe(150);
    expect(calculateCommission(1234)).toBe(123.4);
  });

  it("returns 0 for zero or negative total price", () => {
    expect(calculateCommission(0)).toBe(0);
    expect(calculateCommission(-100)).toBe(0);
  });

  it("handles small amounts correctly", () => {
    expect(calculateCommission(1)).toBe(0.1);
    expect(calculateCommission(99)).toBe(9.9);
  });
});

describe("validatePayoutRequest", () => {
  it("returns null for valid request", () => {
    expect(
      validatePayoutRequest({ profileId: "p1", selectedItemIds: ["i1", "i2"] }),
    ).toBeNull();
  });

  it("returns error when profileId is missing", () => {
    const result = validatePayoutRequest({
      profileId: null,
      selectedItemIds: ["i1"],
    });
    expect(result).toContain("Ажилтан");
  });

  it("returns error when selectedItemIds is empty", () => {
    const result = validatePayoutRequest({
      profileId: "p1",
      selectedItemIds: [],
    });
    expect(result).toContain("Төлөх");
  });
});

describe("calculatePayoutTotal", () => {
  it("sums all commission amounts", () => {
    const items = [
      { commission_amount: 1000 },
      { commission_amount: 2000 },
      { commission_amount: 500 },
    ];
    expect(calculatePayoutTotal(items)).toBe(3500);
  });

  it("returns 0 for empty array", () => {
    expect(calculatePayoutTotal([])).toBe(0);
  });

  it("handles string amounts", () => {
    const items = [{ commission_amount: "1500" as unknown as number }];
    expect(calculatePayoutTotal(items)).toBe(1500);
  });
});

describe("getAlreadyPaidIds", () => {
  it("returns IDs that are already paid", () => {
    const paidItems = [{ sale_item_id: "i1" }, { sale_item_id: "i2" }];
    expect(getAlreadyPaidIds(paidItems, ["i1", "i3"])).toEqual(["i1"]);
  });

  it("returns empty array when none are paid", () => {
    expect(getAlreadyPaidIds([{ sale_item_id: "i1" }], ["i2", "i3"])).toEqual(
      [],
    );
  });

  it("handles empty paid items", () => {
    expect(getAlreadyPaidIds([], ["i1", "i2"])).toEqual([]);
  });
});

describe("buildStaffSummary", () => {
  it("calculates total unpaid correctly", () => {
    const result = buildStaffSummary({
      profileId: "p1",
      fullName: "Тест",
      totalEarned: 50000,
      totalPaid: 20000,
    });
    expect(result.totalUnpaid).toBe(30000);
  });

  it("ensures non-negative values", () => {
    const result = buildStaffSummary({
      profileId: "p1",
      fullName: "Тест",
      totalEarned: -100,
      totalPaid: -50,
    });
    expect(result.totalEarned).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.totalUnpaid).toBe(0);
  });

  it("handles zero values", () => {
    const result = buildStaffSummary({
      profileId: "p2",
      fullName: "Хоосон",
      totalEarned: 0,
      totalPaid: 0,
    });
    expect(result.totalUnpaid).toBe(0);
  });
});
