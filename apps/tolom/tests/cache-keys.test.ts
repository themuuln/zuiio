/**
 * node:test migration POC — the same cache-key contract as the former
 * src/lib/cache/__tests__/keys.test.ts, run via tsx --test (no Vite, no jsdom).
 *
 * Run: pnpm test:unit-node
 * Pattern: pure-logic tests live in tests/ with relative imports; keep them
 * out of src/** so vitest does not pick them up twice.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cacheDurations, cacheTags } from "../src/lib/cache/keys";

const ORG_ID = "org-1";
const ID = "item-1";

describe("cacheTags key shapes", () => {
  it("scopes work order tags by org and id", () => {
    assert.equal(cacheTags.workOrders(ORG_ID), `work-orders:${ORG_ID}`);
    assert.equal(cacheTags.workOrder(ID), `work-order:${ID}`);
    assert.equal(cacheTags.workOrderDetail(ID), `work-order-detail:${ID}`);
    assert.equal(
      cacheTags.dailyWorkOrders(ORG_ID, "2026-08-09"),
      `daily-work-orders:${ORG_ID}:2026-08-09`,
    );
  });

  it("scopes invoices and refunds by org with singular tags by id", () => {
    assert.equal(cacheTags.invoices(ORG_ID), `invoices:${ORG_ID}`);
    assert.equal(cacheTags.invoice(ID), `invoice:${ID}`);
    assert.equal(cacheTags.refunds(ORG_ID), `refunds:${ORG_ID}`);
    assert.equal(cacheTags.refund(ID), `refund:${ID}`);
  });

  it("uses :all for dashboard metrics without a branch", () => {
    assert.equal(cacheTags.dashboardMetrics(ORG_ID), `dashboard:${ORG_ID}:all`);
    assert.equal(
      cacheTags.dashboardMetrics(ORG_ID, "branch-2"),
      `dashboard:${ORG_ID}:branch-2`,
    );
  });

  it("scopes bay view by org and branch", () => {
    assert.equal(
      cacheTags.bayView(ORG_ID, "branch-2"),
      `bay-view:${ORG_ID}:branch-2`,
    );
  });

  it("composes multi-part tags in argument order", () => {
    assert.equal(
      cacheTags.customerNotes(ORG_ID, "cust-1"),
      `customer-notes:${ORG_ID}:cust-1`,
    );
    assert.equal(
      cacheTags.itemVariants(ORG_ID, "part", "part-1"),
      `item-variants:${ORG_ID}:part:part-1`,
    );
    assert.equal(
      cacheTags.dviInspection(ORG_ID, "insp-1"),
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
      assert.equal(typeof tag, "string");
      assert.ok(tag.length > 0);
      for (const arg of args) {
        assert.ok(tag.includes(arg));
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
    assert.equal(tags.size, 4);
  });
});

describe("cacheDurations", () => {
  it("keeps hot data short and reference data long", () => {
    assert.equal(cacheDurations.workOrders, 60);
    assert.equal(cacheDurations.workOrderDetail, 30);
    assert.equal(cacheDurations.bayView, 30);
    assert.equal(cacheDurations.cashRegisterSession, 10);
    assert.equal(cacheDurations.invoice, 30);
    assert.equal(cacheDurations.serviceCatalog, 3600);
    assert.equal(cacheDurations.suppliers, 3600);
    assert.equal(cacheDurations.dashboardMetrics, 300);
  });

  it("defines only positive durations", () => {
    for (const duration of Object.values(cacheDurations)) {
      assert.ok(duration > 0);
      assert.equal(Number.isInteger(duration), true);
    }
  });
});
