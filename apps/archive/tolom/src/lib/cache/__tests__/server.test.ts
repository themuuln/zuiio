import { revalidateTag } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cacheTags as keyCacheTags } from "../keys";
import {
  cacheTags,
  invalidateBayViewCache,
  invalidateBranchCache,
  invalidateCustomerCache,
  invalidateInventoryCache,
  invalidateInvoiceCache,
  invalidateOrgCache,
  invalidateReferenceCache,
  invalidateReportCache,
  invalidateServiceCatalogCache,
  invalidateUserCache,
  invalidateVehicleCache,
  invalidateVehicleModelsCache,
  invalidateWorkOrderCache,
} from "../server";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const ORG_ID = "org-1";
const WORK_ORDER_ID = "wo-1";
const INVOICE_ID = "inv-1";
const BRANCH_ID = "branch-1";

const mockedRevalidateTag = vi.mocked(revalidateTag);

beforeEach(() => {
  mockedRevalidateTag.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("invalidateWorkOrderCache", () => {
  it("revalidates work order list caches without a specific work order", () => {
    invalidateWorkOrderCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(2);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `work-orders:${ORG_ID}`,
      "max",
    );
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `daily-work-orders:${ORG_ID}:${new Date().toISOString().split("T")[0]}`,
      "max",
    );
  });

  it("also revalidates the work order detail caches when a work order id is given", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-06T12:00:00Z"));

    invalidateWorkOrderCache(ORG_ID, WORK_ORDER_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(4);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `work-orders:${ORG_ID}`,
      "max",
    );
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `daily-work-orders:${ORG_ID}:2026-08-06`,
      "max",
    );
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `work-order:${WORK_ORDER_ID}`,
      "max",
    );
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `work-order-detail:${WORK_ORDER_ID}`,
      "max",
    );
  });
});

describe("invalidateOrgCache", () => {
  it("revalidates every org-scoped cache tag", () => {
    invalidateOrgCache(ORG_ID);

    const expectedTags = [
      `work-orders:${ORG_ID}`,
      `service-catalog:${ORG_ID}`,
      `branches:${ORG_ID}`,
      `customers:${ORG_ID}`,
      `vehicles:${ORG_ID}`,
      `reports:${ORG_ID}`,
      `dashboard:${ORG_ID}:all`,
      `parts-catalog:${ORG_ID}`,
      `inventory-balances:${ORG_ID}`,
      `invoices:${ORG_ID}`,
      `org-users:${ORG_ID}`,
      `vehicle-models:${ORG_ID}`,
      `suppliers:${ORG_ID}`,
      `stock-thresholds:${ORG_ID}`,
      `purchase-orders:${ORG_ID}`,
    ];

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(expectedTags.length);
    for (const tag of expectedTags) {
      expect(mockedRevalidateTag).toHaveBeenCalledWith(tag, "max");
    }
  });
});

describe("invalidateCustomerCache", () => {
  it("revalidates the customers tag with max priority", () => {
    invalidateCustomerCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `customers:${ORG_ID}`,
      "max",
    );
  });
});

describe("invalidateVehicleCache", () => {
  it("revalidates the vehicles tag with max priority", () => {
    invalidateVehicleCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `vehicles:${ORG_ID}`,
      "max",
    );
  });
});

describe("invalidateServiceCatalogCache", () => {
  it("revalidates the service-catalog tag with max priority", () => {
    invalidateServiceCatalogCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `service-catalog:${ORG_ID}`,
      "max",
    );
  });
});

describe("invalidateBranchCache", () => {
  it("revalidates the branches tag with max priority", () => {
    invalidateBranchCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `branches:${ORG_ID}`,
      "max",
    );
  });
});

describe("invalidateVehicleModelsCache", () => {
  it("revalidates the vehicle-models tag with max priority", () => {
    invalidateVehicleModelsCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `vehicle-models:${ORG_ID}`,
      "max",
    );
  });
});

describe("invalidateInventoryCache", () => {
  it("revalidates every inventory-related tag", () => {
    invalidateInventoryCache(ORG_ID);

    const expectedTags = [
      `parts-catalog:${ORG_ID}`,
      `inventory-balances:${ORG_ID}`,
      `inventory-movements:${ORG_ID}`,
      `purchase-orders:${ORG_ID}`,
      `stock-thresholds:${ORG_ID}`,
      `suppliers:${ORG_ID}`,
    ];

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(expectedTags.length);
    for (const tag of expectedTags) {
      expect(mockedRevalidateTag).toHaveBeenCalledWith(tag, "max");
    }
  });
});

describe("invalidateInvoiceCache", () => {
  it("revalidates the org invoices tag without a specific invoice", () => {
    invalidateInvoiceCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `invoices:${ORG_ID}`,
      "max",
    );
  });

  it("also revalidates the invoice tag when an invoice id is given", () => {
    invalidateInvoiceCache(ORG_ID, INVOICE_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(2);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `invoices:${ORG_ID}`,
      "max",
    );
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `invoice:${INVOICE_ID}`,
      "max",
    );
  });
});

describe("invalidateReportCache", () => {
  it("revalidates the reports and dashboard tags", () => {
    invalidateReportCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(2);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `reports:${ORG_ID}`,
      "max",
    );
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `dashboard:${ORG_ID}:all`,
      "max",
    );
  });
});

describe("invalidateUserCache", () => {
  it("revalidates the org-users tag with max priority", () => {
    invalidateUserCache(ORG_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `org-users:${ORG_ID}`,
      "max",
    );
  });
});

describe("invalidateBayViewCache", () => {
  it("revalidates the bay-view tag scoped to org and branch", () => {
    invalidateBayViewCache(ORG_ID, BRANCH_ID);

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockedRevalidateTag).toHaveBeenCalledWith(
      `bay-view:${ORG_ID}:${BRANCH_ID}`,
      "max",
    );
  });
});

describe("invalidateReferenceCache", () => {
  it("revalidates every reference-data tag", () => {
    invalidateReferenceCache(ORG_ID);

    const expectedTags = [
      `service-catalog:${ORG_ID}`,
      `branches:${ORG_ID}`,
      `customers:${ORG_ID}`,
      `vehicles:${ORG_ID}`,
      `vehicle-models:${ORG_ID}`,
      `suppliers:${ORG_ID}`,
    ];

    expect(mockedRevalidateTag).toHaveBeenCalledTimes(expectedTags.length);
    for (const tag of expectedTags) {
      expect(mockedRevalidateTag).toHaveBeenCalledWith(tag, "max");
    }
  });
});

describe("cacheTags re-export", () => {
  it("re-exports the cacheTags object from ./keys", () => {
    expect(cacheTags).toBe(keyCacheTags);
  });
});
