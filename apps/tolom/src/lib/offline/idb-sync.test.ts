import { beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";

// The shared node setup mocks idb-store for service tests; these tests run the
// real sync helpers against fake-indexeddb.
vi.unmock("@/lib/offline/idb-store");
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

import {
  clearAllData,
  getListResponse,
  getOrgRecords,
  getRecord,
} from "@/lib/offline/idb-store";
import {
  clearCachedOrg,
  getCachedList,
  syncApiResponse,
  syncListResponse,
  syncRecord,
  syncRecords,
} from "@/lib/offline/idb-sync";

async function resetDb(): Promise<void> {
  await clearAllData();
}

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDb();
});

describe("syncRecord", () => {
  it("caches a single record with org scoping", async () => {
    const record = { id: "c1", name: "Alice" };
    await syncRecord("customers", "org-1", record);

    await expect(getRecord("customers", "c1")).resolves.toMatchObject({
      id: "c1",
      organization_id: "org-1",
      data: record,
    });
    await expect(getOrgRecords("customers", "org-1")).resolves.toHaveLength(1);
  });

  it("falls back to record_id and then to an empty id", async () => {
    await syncRecord("customers", "org-1", { record_id: "r2", name: "Bob" });
    await syncRecord("customers", "org-1", { name: "NoId" });

    await expect(getRecord("customers", "r2")).resolves.toMatchObject({
      data: { record_id: "r2", name: "Bob" },
    });
    await expect(getRecord("customers", "")).resolves.toMatchObject({
      data: { name: "NoId" },
    });
  });
});

describe("syncRecords", () => {
  it("is a no-op for empty or non-array input", async () => {
    await syncRecords("customers", "org-1", []);
    await syncRecords(
      "customers",
      "org-1",
      "not-an-array" as unknown as unknown[],
    );

    await expect(getOrgRecords("customers", "org-1")).resolves.toEqual([]);
  });

  it("filters non-object entries and batch-caches the rest", async () => {
    await syncRecords("customers", "org-1", [
      null,
      "string-entry",
      42,
      { id: "a", name: "A" },
      { record_id: "b", name: "B" },
      { name: "NoId" },
    ]);

    const records = await getOrgRecords("customers", "org-1");
    expect(records.map((r) => r.id).sort()).toEqual(["", "a", "b"]);
    expect(records.map((r) => r.organization_id)).toEqual([
      "org-1",
      "org-1",
      "org-1",
    ]);
  });
});

describe("syncListResponse / getCachedList", () => {
  it("round-trips a cached list response", async () => {
    const data = [{ id: "c1", name: "Alice" }];
    await syncListResponse("customers", "org-1", "org-1::/api/customers", data);

    await expect(getCachedList("org-1::/api/customers")).resolves.toMatchObject(
      {
        store: "customers",
        organization_id: "org-1",
        cacheKey: "org-1::/api/customers",
        data,
      },
    );
  });

  it("returns null for an unknown cacheKey", async () => {
    await expect(getCachedList("missing-key")).resolves.toBeNull();
  });
});

describe("syncApiResponse", () => {
  it("caches direct array responses plus a list response", async () => {
    const payload = [
      { id: "c1", name: "Alice" },
      { id: "c2", name: "Bob" },
    ];
    await syncApiResponse("customers", "org-1", "/api/customers", undefined, {
      data: payload,
    });

    await expect(getOrgRecords("customers", "org-1")).resolves.toHaveLength(2);
    await expect(
      getListResponse("org-1::/api/customers"),
    ).resolves.toMatchObject({
      data: payload,
    });
  });

  it("caches paginated { data: { data: [...] } } responses", async () => {
    const payload = [{ id: "c1", name: "Alice" }];
    await syncApiResponse("customers", "org-1", "/api/customers", undefined, {
      data: { data: payload, total: 1 },
    });

    await expect(getOrgRecords("customers", "org-1")).resolves.toHaveLength(1);
    await expect(
      getListResponse("org-1::/api/customers"),
    ).resolves.toMatchObject({
      data: payload,
    });
  });

  it("caches single-object responses as a record", async () => {
    const payload = { id: "c1", name: "Alice" };
    await syncApiResponse(
      "customers",
      "org-1",
      "/api/customers/c1",
      undefined,
      {
        data: payload,
      },
    );

    await expect(getRecord("customers", "c1")).resolves.toMatchObject({
      data: payload,
    });
    await expect(
      getListResponse("org-1::/api/customers/c1"),
    ).resolves.toBeNull();
  });

  it("ignores payloads without usable data", async () => {
    await syncApiResponse(
      "customers",
      "org-1",
      "/api/customers",
      undefined,
      {},
    );
    await syncApiResponse("customers", "org-1", "/api/customers", undefined, {
      data: "not-an-object",
    });
    await syncApiResponse("customers", "org-1", "/api/customers", undefined, {
      data: { data: "not-an-array" },
    });

    await expect(getOrgRecords("customers", "org-1")).resolves.toEqual([]);
    await expect(getListResponse("org-1::/api/customers")).resolves.toBeNull();
  });

  it("builds a deterministic cache key from sorted params, dropping undefined", async () => {
    await syncApiResponse(
      "customers",
      "org-1",
      "/api/customers",
      { z: 1, a: "x", skip: undefined },
      { data: [] },
    );

    await expect(
      getListResponse("org-1::/api/customers?a=x&z=1"),
    ).resolves.not.toBeNull();
  });

  it("omits the query string when there are no params", async () => {
    await syncApiResponse("customers", "org-1", "/api/customers", undefined, {
      data: [],
    });

    await expect(
      getListResponse("org-1::/api/customers"),
    ).resolves.not.toBeNull();
  });
});

describe("clearCachedOrg", () => {
  it("clears only the given org's cached data", async () => {
    await syncRecord("customers", "org-1", { id: "c1" });
    await syncRecord("customers", "org-2", { id: "c2" });
    await syncListResponse("customers", "org-1", "k-org1", []);
    await syncListResponse("customers", "org-2", "k-org2", []);

    await clearCachedOrg("org-1");

    await expect(getOrgRecords("customers", "org-1")).resolves.toEqual([]);
    await expect(getOrgRecords("customers", "org-2")).resolves.toHaveLength(1);
    await expect(getListResponse("k-org1")).resolves.toBeNull();
    await expect(getListResponse("k-org2")).resolves.not.toBeNull();
  });
});
