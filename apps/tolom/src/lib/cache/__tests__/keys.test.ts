import { describe, expect, it } from "vitest";
import { cacheDurations, cacheTags } from "../keys";

const ORG_ID = "org-1";
const ID = "item-1";

describe("cacheTags key shapes", () => {
  it("scopes work order tags by org and id", () => {
    expect(cacheTags.workOrders(ORG_ID)).toBe(`work-orders:${ORG_ID}`);
    expect(cacheTags.workOrder(ID)).toBe(`work-order:${ID}`);
    expect(cacheTags.workOrderDetail(ID)).toBe(`work-order-detail:${ID}`);
    expect(cacheTags.dailyWorkOrders(ORG_ID, "2026-08-09")).toBe(
      `daily-work-orders:${ORG_ID}:2026-08-09`,
    );
  });

  it("scopes invoices and refunds by org with singular tags by id", () => {
    expect(cacheTags.invoices(ORG_ID)).toBe(`invoices:${ORG_ID}`);
    expect(cacheTags.invoice(ID)).toBe(`invoice:${ID}`);
    expect(cacheTags.refunds(ORG_ID)).toBe(`refunds:${ORG_ID}`);
    expect(cacheTags.refund(ID)).toBe(`refund:${ID}`);
  });

  it("uses :all for dashboard metrics without a branch", () => {
    expect(cacheTags.dashboardMetrics(ORG_ID)).toBe(`dashboard:${ORG_ID}:all`);
    expect(cacheTags.dashboardMetrics(ORG_ID, "branch-2")).toBe(
      `dashboard:${ORG_ID}:branch-2`,
    );
  });

  it("scopes bay view by org and branch", () => {
    expect(cacheTags.bayView(ORG_ID, "branch-2")).toBe(
      `bay-view:${ORG_ID}:branch-2`,
    );
  });

  it("composes multi-part tags in argument order", () => {
    expect(cacheTags.customerNotes(ORG_ID, "cust-1")).toBe(
      `customer-notes:${ORG_ID}:cust-1`,
    );
    expect(cacheTags.itemVariants(ORG_ID, "part", "part-1")).toBe(
      `item-variants:${ORG_ID}:part:part-1`,
    );
    expect(cacheTags.dviInspection(ORG_ID, "insp-1")).toBe(
      `dvi:${ORG_ID}:insp-1`,
    );
  });

  it("embeds every argument into the produced tag", () => {
    for (const fn of Object.values(cacheTags)) {
      const args = Array.from(
        { length: fn.length },
        (_, index) => `arg${index}`,
      );
      const tag = (fn as (...a: string[]) => string)(...args);
      expect(typeof tag).toBe("string");
      expect(tag.length).toBeGreaterThan(0);
      for (const arg of args) {
        expect(tag).toContain(arg);
      }
    }
  });

  it("produces distinct tags for different scopes", () => {
    const tags = new Set([
      cacheTags.workOrders(ORG_ID),
      cacheTags.customers(ORG_ID),
      cacheTags.invoices(ORG_ID),
      cacheTags.expenses(ORG_ID),
    ]);
    expect(tags.size).toBe(4);
  });
});

describe("cacheDurations", () => {
  it("keeps hot data short and reference data long", () => {
    expect(cacheDurations.workOrders).toBe(60);
    expect(cacheDurations.workOrderDetail).toBe(30);
    expect(cacheDurations.bayView).toBe(30);
    expect(cacheDurations.cashRegisterSession).toBe(10);
    expect(cacheDurations.invoice).toBe(30);
    expect(cacheDurations.serviceCatalog).toBe(3600);
    expect(cacheDurations.suppliers).toBe(3600);
    expect(cacheDurations.dashboardMetrics).toBe(300);
  });

  it("defines only positive durations", () => {
    for (const duration of Object.values(cacheDurations)) {
      expect(duration).toBeGreaterThan(0);
      expect(Number.isInteger(duration)).toBe(true);
    }
  });
});
