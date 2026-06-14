import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { PaginatedResponse } from "@/lib/types";
import type { FieldMap } from "./build-updates";
import { createCrudService } from "./create-crud-service";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRevalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

const mockCreateAuditLog = vi.fn();
vi.mock("@/lib/audit", () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

const mockResolveBranchId = vi.fn();
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: (...args: unknown[]) => mockResolveBranchId(...args),
}));

const mockBuildUpdates = vi.fn();
vi.mock("./build-updates", async () => {
  const actual = await vi.importActual<typeof import("./build-updates")>(
    "./build-updates",
  );
  return {
    ...actual,
    buildUpdates: (...args: unknown[]) => mockBuildUpdates(...args),
  };
});

// ---------------------------------------------------------------------------
// Mock Query Builder
// ---------------------------------------------------------------------------

type AsyncResult = Promise<{ data: unknown; count?: number | null; error: unknown }>;

function createQueryBuilder(results?: {
  rangeResult?: AsyncResult;
  singleResult?: AsyncResult;
  insertSingleResult?: AsyncResult;
  updateSingleResult?: AsyncResult;
  updateResult?: AsyncResult;
}) {
  const defaultRangeResult: AsyncResult = Promise.resolve({
    data: [],
    count: 0,
    error: null,
  });
  const defaultSingleResult: AsyncResult = Promise.resolve({
    data: null,
    error: { message: "Not found", code: "PGRST116" },
  });

  interface BuilderType {
    [key: string]: ReturnType<typeof vi.fn> | Array<unknown> | (() => Array<{ method: string; args: unknown[] }>);
    _chainCalls: Array<{ method: string; args: unknown[] }>;
    _getChainCalls: () => Array<{ method: string; args: unknown[] }>;
  }

  const builder: BuilderType = {
    eq: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    single: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    or: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    not: vi.fn(),
    in: vi.fn(),
    maybeSingle: vi.fn(),
    _chainCalls: [] as Array<{ method: string; args: unknown[] }>,
    _getChainCalls: function () {
      return this._chainCalls as Array<{ method: string; args: unknown[] }>;
    },
  };

  // Track chain calls for assertion
  const track = (method: string, args: unknown[]) => {
    builder._chainCalls.push({ method, args });
  };

  // All chainable methods return `this`
  for (const method of ["eq", "is", "order", "or", "gte", "lte", "not", "in"]) {
    builder[method] = vi.fn((...args: unknown[]) => {
      track(method, args);
      return builder;
    });
  }
  builder.limit = vi.fn((...args: unknown[]) => {
    track("limit", args);
    return builder;
  });

  // .select() is chainable
  builder.select = vi.fn((...args: unknown[]) => {
    track("select", args);
    return builder;
  });

  // .insert() returns builder for chaining .select()
  builder.insert = vi.fn((...args: unknown[]) => {
    track("insert", args);
    return builder;
  });

  // .update() returns builder for chaining
  builder.update = vi.fn((...args: unknown[]) => {
    track("update", args);
    return builder;
  });

  // Terminal methods
  builder.range = vi.fn((...args: unknown[]) => {
    track("range", args);
    return results?.rangeResult ?? defaultRangeResult;
  });

  builder.single = vi.fn((...args: unknown[]) => {
    track("single", args);
    return results?.singleResult ?? defaultSingleResult;
  });

  return builder;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

interface TestRecord {
  id: string;
  name: string;
  organization_id: string;
  deleted_at: string | null;
}

interface TestCreateParams {
  name: string;
  branchId?: string;
}

interface TestUpdateParams {
  name?: string;
}

const testFieldMap: FieldMap<TestUpdateParams> = {
  columns: { name: "name" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  mockBuildUpdates.mockImplementation(
    (params: Record<string, unknown>, _fieldMap: unknown) => {
      const updates: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined) {
          updates[key === "name" ? "name" : key] = val;
        }
      }
      return updates;
    },
  );
});

// ---------------------------------------------------------------------------
// Tests: Factory Shape
// ---------------------------------------------------------------------------

describe("createCrudService", () => {
  it("returns { getAll, getById, create, update, softDelete }", () => {
    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name, organization_id",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    expect(crud).toHaveProperty("getAll");
    expect(crud).toHaveProperty("getById");
    expect(crud).toHaveProperty("create");
    expect(crud).toHaveProperty("update");
    expect(crud).toHaveProperty("softDelete");
    expect(typeof crud.getAll).toBe("function");
    expect(typeof crud.getById).toBe("function");
    expect(typeof crud.create).toBe("function");
    expect(typeof crud.update).toBe("function");
    expect(typeof crud.softDelete).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Tests: getAll
// ---------------------------------------------------------------------------

describe("getAll", () => {
  it("applies .eq('organization_id', orgId) AND .is('deleted_at', null) filters", async () => {
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({ data: [], count: 0, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.getAll(db, "org-1");

    // Find the chain calls for eq and is
    const eqCalls = builder._getChainCalls().filter((c) => c.method === "eq");
    const isCalls = builder._getChainCalls().filter((c) => c.method === "is");

    expect(eqCalls.some((c) => c.args[0] === "organization_id" && c.args[1] === "org-1")).toBe(true);
    expect(isCalls.some((c) => c.args[0] === "deleted_at" && c.args[1] === null)).toBe(true);
  });

  it("returns a PaginatedResponse with correct shape", async () => {
    const fakeData = [
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
    ];
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({
        data: fakeData,
        count: 10,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    const result = await crud.getAll(db, "org-1", { page: 2, pageSize: 5 });

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("pageSize");
    expect(result).toHaveProperty("totalPages");
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(10);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(5);
    expect(result.totalPages).toBe(2); // ceil(10/5) = 2
  });

  it("applies branch filter when branchId is provided", async () => {
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({ data: [], count: 0, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.getAll(db, "org-1", { branchId: "branch-2" });

    const eqCalls = builder._getChainCalls().filter((c) => c.method === "eq");
    expect(
      eqCalls.some((c) => c.args[0] === "branch_id" && c.args[1] === "branch-2"),
    ).toBe(true);
  });

  it("applies default ordering when configured", async () => {
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({ data: [], count: 0, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      orderBy: { column: "name", direction: "asc" },
    });

    await crud.getAll(db, "org-1");

    const orderCalls = builder._getChainCalls().filter((c) => c.method === "order");
    expect(orderCalls.length).toBeGreaterThanOrEqual(1);
    expect(orderCalls[0].args[0]).toBe("name");
  });

  it("calls onQuery hook with the query builder and options", async () => {
    const onQuery = vi.fn().mockImplementation((q: unknown) => q);
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({ data: [], count: 0, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      hooks: { onQuery },
    });

    const options = { page: 1, pageSize: 10, search: "test" };
    await crud.getAll(db, "org-1", options as any);

    expect(onQuery).toHaveBeenCalledTimes(1);
    expect(onQuery).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ search: "test" }));
  });

  it("throws error when Supabase query fails", async () => {
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({
        data: [],
        count: 0,
        error: { message: "DB error" },
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await expect(crud.getAll(db, "org-1")).rejects.toThrow("DB error");
  });

  it("defaults to page 1 and pageSize 50", async () => {
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({ data: [], count: 0, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.getAll(db, "org-1");

    const rangeCalls = builder._getChainCalls().filter((c) => c.method === "range");
    expect(rangeCalls.length).toBeGreaterThanOrEqual(1);
    // offset = (1-1)*50 = 0, end = 0 + 50 - 1 = 49
    expect(rangeCalls[0].args).toEqual([0, 49]);
  });

  it("caps pageSize at 100", async () => {
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({ data: [], count: 0, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.getAll(db, "org-1", { pageSize: 999 });

    const rangeCalls = builder._getChainCalls().filter((c) => c.method === "range");
    expect(rangeCalls[0].args).toEqual([0, 99]); // 100 - 1
  });
});

// ---------------------------------------------------------------------------
// Tests: getById
// ---------------------------------------------------------------------------

describe("getById", () => {
  it("returns the typed record when found", async () => {
    const fakeRecord = { id: "rec-1", name: "Test", organization_id: "org-1" };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: fakeRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name, organization_id",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    const result = await crud.getById(db, "org-1", "rec-1");

    expect(result).toEqual(fakeRecord);
    // Verify the chain has correct filters
    const eqCalls = builder._getChainCalls().filter((c) => c.method === "eq");
    expect(
      eqCalls.some((c) => c.args[0] === "id" && c.args[1] === "rec-1"),
    ).toBe(true);
    expect(
      eqCalls.some((c) => c.args[0] === "organization_id" && c.args[1] === "org-1"),
    ).toBe(true);
    const isCalls = builder._getChainCalls().filter((c) => c.method === "is");
    expect(
      isCalls.some((c) => c.args[0] === "deleted_at" && c.args[1] === null),
    ).toBe(true);
  });

  it("throws NotFoundError when record is missing", async () => {
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: null,
        error: { message: "Not found", code: "PGRST116" },
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await expect(crud.getById(db, "org-1", "missing-id")).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: create
// ---------------------------------------------------------------------------

describe("create", () => {
  it("inserts a record and returns the typed result", async () => {
    const createdRecord = {
      id: "new-1",
      name: "New Item",
      organization_id: "org-1",
      deleted_at: null,
    };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: createdRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name, organization_id",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    const result = await crud.create(db, "org-1", { name: "New Item" }, "user-1");

    expect(result).toEqual(createdRecord);

    // Verify insert was called with org + user fields added
    const insertCalls = builder._getChainCalls().filter((c) => c.method === "insert");
    expect(insertCalls.length).toBe(1);
    const insertArg = insertCalls[0].args[0] as Record<string, unknown>;
    expect(insertArg.organization_id).toBe("org-1");
    expect(insertArg.created_by).toBe("user-1");
    expect(insertArg.updated_by).toBe("user-1");
    expect(insertArg.name).toBe("New Item");
  });

  it("calls createAuditLog with correct params", async () => {
    const createdRecord = {
      id: "new-1",
      name: "New Item",
      organization_id: "org-1",
    };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: createdRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.create(db, "org-1", { name: "New Item" }, "user-1");

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: db,
        action: "create",
        table_name: "test_table",
        record_id: "new-1",
        user_id: "user-1",
        organization_id: "org-1",
        new_data: createdRecord,
      }),
    );
  });

  it("calls revalidateTag after creation", async () => {
    const createdRecord = {
      id: "new-1",
      name: "New Item",
      organization_id: "org-1",
    };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: createdRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      cacheTagKeyById: (id) => `test:record:${id}`,
    });

    await crud.create(db, "org-1", { name: "New Item" }, "user-1");

    expect(mockRevalidateTag).toHaveBeenCalledWith("test:org-1", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("test:record:new-1", "max");
  });

  it("calls beforeCreate hook and merges result", async () => {
    const createdRecord = {
      id: "new-1",
      name: "Modified Name",
      organization_id: "org-1",
    };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: createdRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const beforeCreate = vi.fn().mockResolvedValue({ name: "Modified Name" });
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      hooks: { beforeCreate },
    });

    await crud.create(db, "org-1", { name: "Original Name" }, "user-1");

    expect(beforeCreate).toHaveBeenCalledTimes(1);
    expect(beforeCreate).toHaveBeenCalledWith(
      { name: "Original Name" },
      expect.objectContaining({ orgId: "org-1", userId: "user-1" }),
    );
    // Verify the merged name was inserted
    const insertCalls = builder._getChainCalls().filter((c) => c.method === "insert");
    const insertArg = insertCalls[0].args[0] as Record<string, unknown>;
    expect(insertArg.name).toBe("Modified Name");
  });

  it("calls afterCreate hook after successful creation", async () => {
    const createdRecord = {
      id: "new-1",
      name: "New Item",
      organization_id: "org-1",
    };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: createdRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const afterCreate = vi.fn().mockResolvedValue(undefined);
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      hooks: { afterCreate },
    });

    const result = await crud.create(db, "org-1", { name: "New Item" }, "user-1");

    expect(afterCreate).toHaveBeenCalledTimes(1);
    expect(afterCreate).toHaveBeenCalledWith(
      result,
      expect.objectContaining({ orgId: "org-1", userId: "user-1" }),
    );
  });

  it("resolves branchId when params include branchId", async () => {
    const createdRecord = {
      id: "new-1",
      name: "New Item",
      organization_id: "org-1",
      branch_id: "branch-1",
    };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: createdRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name, branch_id",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.create(db, "org-1", { name: "New Item", branchId: "branch-1" }, "user-1");

    expect(mockResolveBranchId).toHaveBeenCalledWith(
      db,
      "org-1",
      "branch-1",
      { strict: false },
    );
    const insertCalls = builder._getChainCalls().filter((c) => c.method === "insert");
    const insertArg = insertCalls[0].args[0] as Record<string, unknown>;
    expect(insertArg.branch_id).toBe("branch-1");
    // branchId (camelCase) should have been deleted
    expect(insertArg.branchId).toBeUndefined();
  });

  it("throws error when insert fails", async () => {
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: null,
        error: { message: "Insert failed" },
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await expect(
      crud.create(db, "org-1", { name: "Item" }, "user-1"),
    ).rejects.toThrow("Insert failed");
  });
});

// ---------------------------------------------------------------------------
// Tests: update
// ---------------------------------------------------------------------------

describe("update", () => {
  const existingRecord = {
    id: "rec-1",
    name: "Old Name",
    organization_id: "org-1",
    deleted_at: null,
  };

  it("fetches existing, updates, and returns typed result", async () => {
    const updatedRecord = {
      ...existingRecord,
      name: "Updated Name",
    };

    const builder = createQueryBuilder();
    // First single() returns existing, second returns updated
    builder.single = vi
      .fn()
      .mockResolvedValueOnce({ data: existingRecord, error: null })
      .mockResolvedValueOnce({ data: updatedRecord, error: null });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });
    mockBuildUpdates.mockReturnValue({ name: "Updated Name" });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      fieldMap: testFieldMap,
    });

    const result = await crud.update(db, "org-1", "rec-1", { name: "Updated Name" }, "user-1");

    expect(result).toEqual(updatedRecord);
  });

  it("throws NotFoundError when record doesn't exist", async () => {
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: null,
        error: { message: "Not found", code: "PGRST116" },
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await expect(
      crud.update(db, "org-1", "missing-id", { name: "Updated" }, "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when no fields to update (only updated_by)", async () => {
    // First call returns existing, second call would be the update result but we throw before reaching it
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: existingRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    // Set buildUpdates to return only updated_by (no actual changes)
    mockBuildUpdates.mockReturnValue({});

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      fieldMap: testFieldMap,
    });

    await expect(
      crud.update(db, "org-1", "rec-1", {}, "user-1"),
    ).rejects.toThrow(ValidationError);
  });

  it("calls createAuditLog with correct params", async () => {
    const updatedRecord = {
      ...existingRecord,
      name: "Updated Name",
    };

    const builder = createQueryBuilder();
    // Override single to return different values for fetch-existing and update-result
    builder.single = vi
      .fn()
      .mockResolvedValueOnce({ data: existingRecord, error: null })
      .mockResolvedValueOnce({ data: updatedRecord, error: null });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });
    mockBuildUpdates.mockReturnValue({ name: "Updated Name" });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      fieldMap: testFieldMap,
    });

    await crud.update(db, "org-1", "rec-1", { name: "Updated Name" }, "user-1");

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: db,
        action: "update",
        table_name: "test_table",
        record_id: "rec-1",
        user_id: "user-1",
        organization_id: "org-1",
        old_data: existingRecord,
        new_data: updatedRecord,
      }),
    );
  });

  it("calls revalidateTag after update", async () => {
    const updatedRecord = {
      ...existingRecord,
      name: "Updated Name",
    };

    const builder = createQueryBuilder();
    builder.single = vi
      .fn()
      .mockResolvedValueOnce({ data: existingRecord, error: null })
      .mockResolvedValueOnce({ data: updatedRecord, error: null });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });
    mockBuildUpdates.mockReturnValue({ name: "Updated Name" });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      cacheTagKeyById: (id) => `test:record:${id}`,
      fieldMap: testFieldMap,
    });

    await crud.update(db, "org-1", "rec-1", { name: "Updated Name" }, "user-1");

    expect(mockRevalidateTag).toHaveBeenCalledWith("test:org-1", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("test:record:rec-1", "max");
  });

  it("calls beforeUpdate hook with existing record and params", async () => {
    const beforeUpdate = vi.fn().mockResolvedValue({});
    const updatedRecord = {
      ...existingRecord,
      name: "Updated Name",
    };

    const builder = createQueryBuilder();
    // Override single to return existing first, then updated
    builder.single = vi
      .fn()
      .mockResolvedValueOnce({ data: existingRecord, error: null })
      .mockResolvedValueOnce({ data: updatedRecord, error: null });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });
    mockBuildUpdates.mockReturnValue({ name: "Updated Name" });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      fieldMap: testFieldMap,
      hooks: { beforeUpdate },
    });

    await crud.update(db, "org-1", "rec-1", { name: "Updated Name" }, "user-1");

    expect(beforeUpdate).toHaveBeenCalledTimes(1);
    expect(beforeUpdate).toHaveBeenCalledWith(
      existingRecord,
      { name: "Updated Name" },
      expect.objectContaining({ orgId: "org-1", userId: "user-1" }),
    );
  });

  it("calls afterUpdate hook after successful update", async () => {
    const afterUpdate = vi.fn().mockResolvedValue(undefined);
    const updatedRecord = {
      ...existingRecord,
      name: "Updated Name",
    };

    const builder = createQueryBuilder();
    builder.single = vi
      .fn()
      .mockResolvedValueOnce({ data: existingRecord, error: null })
      .mockResolvedValueOnce({ data: updatedRecord, error: null });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });
    mockBuildUpdates.mockReturnValue({ name: "Updated Name" });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      fieldMap: testFieldMap,
      hooks: { afterUpdate },
    });

    const result = await crud.update(db, "org-1", "rec-1", { name: "Updated Name" }, "user-1");

    expect(afterUpdate).toHaveBeenCalledTimes(1);
    expect(afterUpdate).toHaveBeenCalledWith(
      result,
      expect.objectContaining({ orgId: "org-1", userId: "user-1" }),
    );
  });

  it("uses buildUpdates with fieldMap when provided", async () => {
    const updatedRecord = {
      ...existingRecord,
      name: "Updated via fieldMap",
    };

    const builder = createQueryBuilder();
    builder.single = vi
      .fn()
      .mockResolvedValueOnce({ data: existingRecord, error: null })
      .mockResolvedValueOnce({ data: updatedRecord, error: null });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });
    mockBuildUpdates.mockReturnValue({ name: "Updated via fieldMap" });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      fieldMap: testFieldMap,
    });

    await crud.update(db, "org-1", "rec-1", { name: "Updated via fieldMap" }, "user-1");

    // Verify buildUpdates was called with params and fieldMap
    expect(mockBuildUpdates).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Updated via fieldMap" }),
      testFieldMap,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: softDelete
// ---------------------------------------------------------------------------

describe("softDelete", () => {
  const existingRecord = {
    id: "rec-1",
    name: "To Delete",
    organization_id: "org-1",
    deleted_at: null,
  };

  it("sets deleted_at and updated_by on the record", async () => {
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: existingRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.softDelete(db, "org-1", "rec-1", "user-1");

    const updateCalls = builder._getChainCalls().filter((c) => c.method === "update");
    expect(updateCalls.length).toBe(1);
    const updateArg = updateCalls[0].args[0] as Record<string, unknown>;
    expect(updateArg).toHaveProperty("deleted_at");
    expect(typeof updateArg.deleted_at).toBe("string");
    expect(updateArg.updated_by).toBe("user-1");
  });

  it("throws NotFoundError when record doesn't exist", async () => {
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: null,
        error: { message: "Not found", code: "PGRST116" },
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await expect(
      crud.softDelete(db, "org-1", "missing-id", "user-1"),
    ).rejects.toThrow(NotFoundError);
  });

  it("calls createAuditLog with correct params", async () => {
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: existingRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.softDelete(db, "org-1", "rec-1", "user-1");

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: db,
        action: "soft_delete",
        table_name: "test_table",
        record_id: "rec-1",
        user_id: "user-1",
        organization_id: "org-1",
        old_data: existingRecord,
      }),
    );
  });

  it("calls revalidateTag after soft-delete", async () => {
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: existingRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      cacheTagKeyById: (id) => `test:record:${id}`,
    });

    await crud.softDelete(db, "org-1", "rec-1", "user-1");

    expect(mockRevalidateTag).toHaveBeenCalledWith("test:org-1", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("test:record:rec-1", "max");
  });

  it("calls beforeDelete hook with the existing record", async () => {
    const beforeDelete = vi.fn().mockResolvedValue(undefined);
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: existingRecord,
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      cacheTagKey: (orgId) => `test:${orgId}`,
      hooks: { beforeDelete },
    });

    await crud.softDelete(db, "org-1", "rec-1", "user-1");

    expect(beforeDelete).toHaveBeenCalledTimes(1);
    expect(beforeDelete).toHaveBeenCalledWith(
      existingRecord,
      expect.objectContaining({ orgId: "org-1", userId: "user-1" }),
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: Type-safe response mapping
// ---------------------------------------------------------------------------

describe("type-safe response mapping", () => {
  it("getAll returns correctly typed PaginatedResponse", async () => {
    const fakeData = [{ id: "1", name: "Item", organization_id: "org-1", deleted_at: null }];
    const builder = createQueryBuilder({
      rangeResult: Promise.resolve({ data: fakeData, count: 1, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name, organization_id",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    const result: PaginatedResponse<TestRecord> = await crud.getAll(db, "org-1");
    // Type-level assertion: result.data[0] should be TestRecord
    const first: TestRecord = result.data[0];
    expect(first.id).toBe("1");
    expect(first.name).toBe("Item");
  });

  it("getById returns correctly typed record", async () => {
    const fakeRecord = { id: "1", name: "Item", organization_id: "org-1", deleted_at: null };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({ data: fakeRecord, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name, organization_id",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    const result: TestRecord = await crud.getById(db, "org-1", "1");
    expect(result.id).toBe("1");
    expect(result.name).toBe("Item");
  });

  it("create returns correctly typed record", async () => {
    const fakeRecord = { id: "new-1", name: "New", organization_id: "org-1", deleted_at: null };
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({ data: fakeRecord, error: null }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;
    mockCreateAuditLog.mockResolvedValue({ success: true, id: "audit-1", error: null });

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name, organization_id",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    const result: TestRecord = await crud.create(db, "org-1", { name: "New" }, "user-1");
    expect(result.id).toBe("new-1");
    expect(result.name).toBe("New");
  });
});

// ---------------------------------------------------------------------------
// Tests: selectColumnsById override
// ---------------------------------------------------------------------------

describe("selectColumnsById override", () => {
  it("uses selectColumnsById for getById when specified", async () => {
    const builder = createQueryBuilder({
      singleResult: Promise.resolve({
        data: { id: "1", name: "Detail", extra_field: "yes" },
        error: null,
      }),
    });
    const db = { from: vi.fn().mockReturnValue(builder) } as any;

    const crud = createCrudService<
      TestRecord,
      TestCreateParams,
      TestUpdateParams
    >({
      tableName: "test_table",
      selectColumns: "id, name",
      selectColumnsById: "id, name, extra_field",
      cacheTagKey: (orgId) => `test:${orgId}`,
    });

    await crud.getById(db, "org-1", "1");

    const selectCalls = builder._getChainCalls().filter((c) => c.method === "select");
    expect(selectCalls.length).toBeGreaterThanOrEqual(1);
    // The last select call should be for getById
    const lastSelect = selectCalls[selectCalls.length - 1];
    expect(lastSelect.args[0]).toBe("id, name, extra_field");
  });
});
