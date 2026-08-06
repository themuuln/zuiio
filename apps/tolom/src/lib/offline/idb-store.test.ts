import { beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";

// The shared node setup mocks idb-store for service tests; this file tests the
// real implementation against fake-indexeddb.
vi.unmock("@/lib/offline/idb-store");
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

import {
  type CachedListResponse,
  type CachedRecord,
  clearAllData,
  clearOrgData,
  deleteRecord,
  deleteRecords,
  getListResponse,
  getOrgListResponses,
  getOrgRecords,
  getRecord,
  getRecordsByIds,
  getStorageEstimate,
  putListResponse,
  putRecord,
  putRecords,
} from "@/lib/offline/idb-store";
import { reportServerError } from "@/lib/sentry-report-server";

function makeRecord(overrides: Partial<CachedRecord> = {}): CachedRecord {
  return {
    id: "rec-1",
    organization_id: "org-1",
    data: { name: "Alice" },
    cachedAt: 1000,
    ...overrides,
  };
}

function makeListResponse(
  overrides: Partial<CachedListResponse> = {},
): CachedListResponse {
  return {
    store: "customers",
    organization_id: "org-1",
    cacheKey: "org-1::/api/customers",
    data: [{ name: "Alice" }],
    cachedAt: 1000,
    ...overrides,
  };
}

/** Wipe every store so each test starts clean (also exercises getDb's upgrade). */
async function resetDb(): Promise<void> {
  await clearAllData();
}

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDb();
});

describe("putRecord / getRecord", () => {
  it("round-trips a single record", async () => {
    const record = makeRecord();
    await putRecord("customers", record);
    await expect(getRecord("customers", record.id)).resolves.toEqual(record);
  });

  it("overwrites an existing record with the same id", async () => {
    await putRecord("customers", makeRecord({ data: { name: "Alice" } }));
    const updated = makeRecord({ data: { name: "Bob" }, cachedAt: 2000 });
    await putRecord("customers", updated);
    await expect(getRecord("customers", "rec-1")).resolves.toEqual(updated);
  });

  it("returns null for a missing id", async () => {
    await expect(getRecord("customers", "missing")).resolves.toBeNull();
  });
});

describe("organization scoping", () => {
  it("getOrgRecords returns only the org's records, newest cachedAt first", async () => {
    await putRecord("customers", makeRecord({ id: "a", cachedAt: 100 }));
    await putRecord("customers", makeRecord({ id: "b", cachedAt: 300 }));
    await putRecord("customers", makeRecord({ id: "c", cachedAt: 200 }));
    await putRecord(
      "customers",
      makeRecord({ id: "x", organization_id: "org-2", cachedAt: 999 }),
    );

    const records = await getOrgRecords("customers", "org-1");
    expect(records.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("keys records by id only, so a same-id write from another org replaces it", async () => {
    // The store uses keyPath "id"; org scoping lives in the index, so a
    // same-id record from another org overwrites the earlier one.
    await putRecord(
      "customers",
      makeRecord({ id: "shared", data: { org: 1 } }),
    );
    await putRecord(
      "customers",
      makeRecord({ id: "shared", organization_id: "org-2", data: { org: 2 } }),
    );

    await expect(getRecord("customers", "shared")).resolves.toMatchObject({
      organization_id: "org-2",
    });
    await expect(getOrgRecords("customers", "org-1")).resolves.toEqual([]);
    await expect(getOrgRecords("customers", "org-2")).resolves.toHaveLength(1);
  });
});

describe("putRecords / getRecordsByIds", () => {
  it("batch-writes records retrievable per org, newest cachedAt first", async () => {
    await putRecords("vehicles", [
      makeRecord({ id: "v1", cachedAt: 50 }),
      makeRecord({ id: "v2", cachedAt: 500 }),
      makeRecord({ id: "v3", organization_id: "org-2", cachedAt: 900 }),
    ]);

    const records = await getOrgRecords("vehicles", "org-1");
    expect(records.map((r) => r.id)).toEqual(["v2", "v1"]);
  });

  it("getRecordsByIds returns matches in id order and skips missing ids", async () => {
    await putRecords("branches", [
      makeRecord({ id: "b1" }),
      makeRecord({ id: "b2" }),
      makeRecord({ id: "b3" }),
    ]);

    const records = await getRecordsByIds("branches", ["b3", "missing", "b1"]);
    expect(records.map((r) => r.id)).toEqual(["b3", "b1"]);
  });

  it("getRecordsByIds with an empty id list returns an empty array", async () => {
    await expect(getRecordsByIds("branches", [])).resolves.toEqual([]);
  });
});

describe("deleteRecord / deleteRecords", () => {
  it("deletes a single record and tolerates a missing id", async () => {
    await putRecord("customers", makeRecord({ id: "keep" }));
    await putRecord("customers", makeRecord({ id: "gone" }));

    await deleteRecord("customers", "gone");
    await deleteRecord("customers", "never-existed");

    await expect(getRecord("customers", "gone")).resolves.toBeNull();
    await expect(getRecord("customers", "keep")).resolves.not.toBeNull();
  });

  it("deletes multiple records and leaves others intact", async () => {
    await putRecords("customers", [
      makeRecord({ id: "c1" }),
      makeRecord({ id: "c2" }),
      makeRecord({ id: "c3" }),
    ]);

    await deleteRecords("customers", ["c1", "c3", "missing"]);

    await expect(
      getRecordsByIds("customers", ["c1", "c2", "c3"]),
    ).resolves.toEqual([expect.objectContaining({ id: "c2" })]);
  });
});

describe("list response cache", () => {
  it("round-trips a cached list response keyed by cacheKey", async () => {
    const response = makeListResponse();
    await putListResponse(response);
    await expect(getListResponse(response.cacheKey)).resolves.toEqual(response);
  });

  it("returns null for an unknown cacheKey", async () => {
    await expect(
      getListResponse("org-1::/api/customers?nope=1"),
    ).resolves.toBeNull();
  });

  it("overwrites an existing response with the same cacheKey", async () => {
    await putListResponse(makeListResponse({ data: [{ name: "Alice" }] }));
    const updated = makeListResponse({
      data: [{ name: "Bob" }],
      cachedAt: 2000,
    });
    await putListResponse(updated);
    await expect(getListResponse(updated.cacheKey)).resolves.toEqual(updated);
  });

  it("getOrgListResponses filters by both store and org", async () => {
    await putListResponse(makeListResponse({ cacheKey: "k1" }));
    await putListResponse(
      makeListResponse({ store: "vehicles", cacheKey: "k2" }),
    );
    await putListResponse(
      makeListResponse({ organization_id: "org-2", cacheKey: "k3" }),
    );

    const responses = await getOrgListResponses("customers", "org-1");
    expect(responses.map((r) => r.cacheKey)).toEqual(["k1"]);
  });
});

describe("clearOrgData", () => {
  it("clears only the given org's records and list responses", async () => {
    await putRecords("customers", [
      makeRecord({ id: "org1-a", organization_id: "org-1" }),
      makeRecord({ id: "org2-a", organization_id: "org-2" }),
    ]);
    await putRecord(
      "vehicles",
      makeRecord({ id: "org1-v", organization_id: "org-1" }),
    );
    await putListResponse(makeListResponse({ cacheKey: "k1" }));
    await putListResponse(
      makeListResponse({ organization_id: "org-2", cacheKey: "k2" }),
    );

    await clearOrgData("org-1");

    await expect(getOrgRecords("customers", "org-1")).resolves.toEqual([]);
    await expect(getOrgRecords("vehicles", "org-1")).resolves.toEqual([]);
    await expect(getOrgRecords("customers", "org-2")).resolves.toHaveLength(1);
    await expect(getListResponse("k1")).resolves.toBeNull();
    await expect(getListResponse("k2")).resolves.not.toBeNull();
  });
});

describe("clearAllData", () => {
  it("wipes records and list responses from every store", async () => {
    await putRecords("customers", [
      makeRecord({ id: "c1", organization_id: "org-1" }),
      makeRecord({ id: "c2", organization_id: "org-2" }),
    ]);
    await putRecord("vehicles", makeRecord({ id: "v1" }));
    await putListResponse(makeListResponse({ cacheKey: "k1" }));

    await clearAllData();

    await expect(getOrgRecords("customers", "org-1")).resolves.toEqual([]);
    await expect(getOrgRecords("customers", "org-2")).resolves.toEqual([]);
    await expect(getOrgRecords("vehicles", "org-1")).resolves.toEqual([]);
    await expect(getListResponse("k1")).resolves.toBeNull();
  });
});

describe("getStorageEstimate", () => {
  it("returns zeros when navigator.storage.estimate is unavailable", async () => {
    vi.stubGlobal("navigator", { storage: {} });
    try {
      await expect(getStorageEstimate()).resolves.toEqual({
        used: 0,
        quota: 0,
        percent: 0,
      });
      expect(reportServerError).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns zeros when navigator is undefined", async () => {
    vi.stubGlobal("navigator", undefined);
    try {
      await expect(getStorageEstimate()).resolves.toEqual({
        used: 0,
        quota: 0,
        percent: 0,
      });
      expect(reportServerError).toHaveBeenCalledWith(
        "idbStore_getStorageEstimate",
        expect.any(Error),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("reports usage, quota and percent from the estimate", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: vi.fn().mockResolvedValue({ usage: 1024, quota: 8192 }),
      },
    });
    try {
      await expect(getStorageEstimate()).resolves.toEqual({
        used: 1024,
        quota: 8192,
        percent: 12.5,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns zeros and reports the error when estimate throws", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: vi.fn().mockRejectedValue(new Error("estimate failed")),
      },
    });
    try {
      await expect(getStorageEstimate()).resolves.toEqual({
        used: 0,
        quota: 0,
        percent: 0,
      });
      expect(reportServerError).toHaveBeenCalledWith(
        "idbStore_getStorageEstimate",
        expect.any(Error),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("when IndexedDB is unavailable", () => {
  beforeEach(() => {
    vi.stubGlobal("indexedDB", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const serverError = new Error("IndexedDB is not available on the server");

  it("putRecord rejects and reports the error", async () => {
    await expect(putRecord("customers", makeRecord())).rejects.toThrow(
      serverError.message,
    );
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_putRecord",
      expect.any(Error),
    );
  });

  it("putRecords rejects and reports the error", async () => {
    await expect(putRecords("customers", [makeRecord()])).rejects.toThrow(
      serverError.message,
    );
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_putRecords",
      expect.any(Error),
    );
  });

  it("deleteRecord rejects and reports the error", async () => {
    await expect(deleteRecord("customers", "x")).rejects.toThrow(
      serverError.message,
    );
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_deleteRecord",
      expect.any(Error),
    );
  });

  it("deleteRecords rejects and reports the error", async () => {
    await expect(deleteRecords("customers", ["x"])).rejects.toThrow(
      serverError.message,
    );
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_deleteRecords",
      expect.any(Error),
    );
  });

  it("putListResponse rejects and reports the error", async () => {
    await expect(putListResponse(makeListResponse())).rejects.toThrow(
      serverError.message,
    );
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_putListResponse",
      expect.any(Error),
    );
  });

  it("clearOrgData rejects and reports the error", async () => {
    await expect(clearOrgData("org-1")).rejects.toThrow(serverError.message);
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_clearOrgData",
      expect.any(Error),
    );
  });

  it("clearAllData rejects and reports the error", async () => {
    await expect(clearAllData()).rejects.toThrow(serverError.message);
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_clearAllData",
      expect.any(Error),
    );
  });

  it("getOrgRecords returns an empty array and reports the error", async () => {
    await expect(getOrgRecords("customers", "org-1")).resolves.toEqual([]);
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_getOrgRecords",
      expect.any(Error),
    );
  });

  it("getRecord returns null and reports the error", async () => {
    await expect(getRecord("customers", "x")).resolves.toBeNull();
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_getRecord",
      expect.any(Error),
    );
  });

  it("getRecordsByIds returns an empty array and reports the error", async () => {
    await expect(getRecordsByIds("customers", ["x"])).resolves.toEqual([]);
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_getRecordsByIds",
      expect.any(Error),
    );
  });

  it("getListResponse returns null and reports the error", async () => {
    await expect(getListResponse("k1")).resolves.toBeNull();
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_getListResponse",
      expect.any(Error),
    );
  });

  it("getOrgListResponses returns an empty array and reports the error", async () => {
    await expect(getOrgListResponses("customers", "org-1")).resolves.toEqual(
      [],
    );
    expect(reportServerError).toHaveBeenCalledWith(
      "idbStore_getOrgListResponses",
      expect.any(Error),
    );
  });
});
