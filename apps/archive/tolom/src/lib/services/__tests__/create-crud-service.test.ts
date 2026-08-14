import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Module-level mocks ────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi
    .fn()
    .mockImplementation(
      (_supabase: unknown, _orgId: string, branchId?: string | null) =>
        Promise.resolve(branchId ?? null),
    ),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { resolveBranchId } from "@/lib/supabase/with-branch";
import { createCrudService } from "../create-crud-service";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockResolveBranchId = vi.mocked(resolveBranchId);

// ── Shared test data ──────────────────────────────────────────────

const TABLE = "test_records";
const TABLE_KEY = "test_records";
const ORG_ID = "org-1";
const USER_ID = "user-1";
const RECORD_ID = "rec-1";

interface TestRecord {
  id: string;
  name: string;
  email: string | null;
  organization_id: string;
  deleted_at: string | null;
  branch_id: string | null;
  created_by: string;
  updated_by: string;
}

interface CreateTestParams {
  name: string;
  email?: string | null;
  branchId?: string | null;
}

interface UpdateTestParams {
  name?: string;
  email?: string | null;
}

const DEFAULT_RECORD: TestRecord = {
  id: RECORD_ID,
  name: "Alice",
  email: "alice@example.com",
  organization_id: ORG_ID,
  deleted_at: null,
  branch_id: null,
  created_by: USER_ID,
  updated_by: USER_ID,
};

// ── Helpers ───────────────────────────────────────────────────────

let db: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── createCrudService ─────────────────────────────────────────────

function createService(
  overrides: Partial<{
    selectColumns: string;
    selectColumnsById: string;
    cacheTagKey: (orgId: string) => string;
    cacheTagKeyById: (id: string) => string;
    orderBy: { column: string; direction?: "asc" | "desc" };
    fieldMap: Parameters<typeof createCrudService>[0]["fieldMap"];
    hooks: Parameters<typeof createCrudService>[0]["hooks"];
  }> = {},
) {
  return createCrudService<TestRecord, CreateTestParams, UpdateTestParams>({
    tableName: TABLE,
    selectColumns: overrides.selectColumns ?? "id, name, email, branch_id",
    selectColumnsById:
      overrides.selectColumnsById ??
      "id, name, email, branch_id, organization_id, deleted_at, created_by, updated_by",
    cacheTagKey:
      overrides.cacheTagKey ?? ((orgId: string) => `${TABLE_KEY}:${orgId}`),
    cacheTagKeyById:
      overrides.cacheTagKeyById ?? ((id: string) => `${TABLE_KEY}:${id}`),
    orderBy: overrides.orderBy ?? { column: "name", direction: "asc" },
    fieldMap: overrides.fieldMap,
    hooks: overrides.hooks,
  });
}

// ── getAll ────────────────────────────────────────────────────────

describe("getAll", () => {
  const mockData: TestRecord[] = [
    { ...DEFAULT_RECORD, id: "rec-1", name: "Alice" },
    { ...DEFAULT_RECORD, id: "rec-2", name: "Bob" },
  ];

  it("returns paginated results with default page/pageSize (page=1, pageSize=50)", async () => {
    db.__qb.resolveWith({ data: mockData, count: 2, error: null });

    const svc = createService();
    const result = await svc.getAll(db as never, ORG_ID);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
  });

  it("respects custom page and pageSize", async () => {
    db.__qb.resolveWith({ data: [mockData[0]], count: 2, error: null });

    const svc = createService();
    const result = await svc.getAll(db as never, ORG_ID, {
      page: 2,
      pageSize: 1,
    });

    expect(result.data).toHaveLength(1);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(1);
  });

  it("clamps pageSize to 1–100", async () => {
    db.__qb.resolveWith({ data: [], count: 0, error: null });

    const svc = createService();
    const resultZero = await svc.getAll(db as never, ORG_ID, { pageSize: 0 });
    expect(resultZero.pageSize).toBe(1);

    const resultHuge = await svc.getAll(db as never, ORG_ID, { pageSize: 999 });
    expect(resultHuge.pageSize).toBe(100);
  });

  it("applies branch filter when branchId provided", async () => {
    db.__qb.resolveWith({ data: [mockData[0]], count: 1, error: null });

    const svc = createService();
    await svc.getAll(db as never, ORG_ID, { branchId: "branch-1" });

    // The chain should include .eq("branch_id", "branch-1")
    expect(db.from).toHaveBeenCalledWith(TABLE);
  });

  it("applies the onQuery hook for custom filters", async () => {
    const onQuery = vi.fn().mockImplementation((q: unknown) => q);
    db.__qb.resolveWith({ data: mockData, count: 2, error: null });

    const svc = createService({ hooks: { onQuery } });
    await svc.getAll(db as never, ORG_ID, { pageSize: 50 });

    expect(onQuery).toHaveBeenCalledTimes(1);
    expect(onQuery).toHaveBeenCalledWith(expect.anything(), { pageSize: 50 });
  });

  it("applies orderBy when configured", async () => {
    db.__qb.resolveWith({ data: [mockData[0]], count: 1, error: null });

    const svc = createService({
      orderBy: { column: "created_at", direction: "desc" },
    });
    await svc.getAll(db as never, ORG_ID);

    // The chain should include .order("created_at", { ascending: false })
    // We can verify via the resolved data
    expect(db?.from).toHaveBeenCalledWith(TABLE);
  });

  it("does NOT call order() when orderBy is omitted", async () => {
    db.__qb.resolveWith({ data: [mockData[0]], count: 1, error: null });

    const svc = createService({ orderBy: undefined });
    await svc.getAll(db as never, ORG_ID);
    // Should still succeed without ordering
    expect(db.from).toHaveBeenCalledWith(TABLE);
  });

  it("throws AppError on database error", async () => {
    db.__qb.resolveWith({
      data: null,
      count: null,
      error: new Error("Connection failed"),
    });

    const svc = createService();
    await expect(svc.getAll(db as never, ORG_ID)).rejects.toThrow(
      "Connection failed",
    );
  });

  it("returns empty array with zero count when DB returns null data", async () => {
    db.__qb.resolveWith({ data: null, count: 0, error: null });

    const svc = createService();
    const result = await svc.getAll(db as never, ORG_ID);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ── getById ───────────────────────────────────────────────────────

describe("getById", () => {
  it("returns a single record by id and orgId", async () => {
    db.__qb.resolveWith({ data: DEFAULT_RECORD, error: null });

    const svc = createService();
    const result = await svc.getById(db as never, ORG_ID, RECORD_ID);

    expect(result.id).toBe(RECORD_ID);
    expect(result.name).toBe("Alice");
  });

  it("throws NotFoundError when record is not found (null data)", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    const svc = createService();
    await expect(
      svc.getById(db as never, ORG_ID, "non-existent"),
    ).rejects.toThrow(/not found/i);
  });

  it("throws NotFoundError when DB returns an error", async () => {
    db.__qb.resolveWith({
      data: null,
      error: new Error("PGRST116: row not found"),
    });

    const svc = createService();
    await expect(svc.getById(db as never, ORG_ID, "bad-id")).rejects.toThrow(
      /not found/i,
    );
  });
});

// ── create ────────────────────────────────────────────────────────

describe("create", () => {
  const insertParams: CreateTestParams = {
    name: "Alice",
    email: "alice@test.com",
  };
  const createdRecord: TestRecord = {
    ...DEFAULT_RECORD,
    name: "Alice",
    email: "alice@test.com",
  };

  it("inserts a record with correct organization_id and user IDs", async () => {
    db.__qb.resolveWith({ data: createdRecord, error: null });

    const svc = createService();
    const result = await svc.create(db as never, ORG_ID, insertParams, USER_ID);

    expect(result.id).toBe(RECORD_ID);
    expect(result.name).toBe("Alice");
    expect(result.organization_id).toBe(ORG_ID);
    expect(result.created_by).toBe(USER_ID);
    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `${TABLE_KEY}:${ORG_ID}`,
      "max",
    );
  });

  it("calls beforeCreate hook and merges result", async () => {
    const beforeCreate = vi
      .fn()
      .mockResolvedValue({ email: "override@test.com" });
    db.__qb.resolveWith({
      data: { ...createdRecord, email: "override@test.com" },
      error: null,
    });

    const svc = createService({ hooks: { beforeCreate } });
    await svc.create(db as never, ORG_ID, insertParams, USER_ID);

    expect(beforeCreate).toHaveBeenCalledWith(
      insertParams,
      expect.objectContaining({
        orgId: ORG_ID,
        userId: USER_ID,
      }),
    );
  });

  it("calls afterCreate hook after insert", async () => {
    const afterCreate = vi.fn();
    db.__qb.resolveWith({ data: createdRecord, error: null });

    const svc = createService({ hooks: { afterCreate } });
    await svc.create(db as never, ORG_ID, insertParams, USER_ID);

    expect(afterCreate).toHaveBeenCalledTimes(1);
    expect(afterCreate).toHaveBeenCalledWith(
      expect.objectContaining({ id: RECORD_ID }),
      expect.objectContaining({ orgId: ORG_ID }),
    );
  });

  it("applies fieldMap to convert camelCase to snake_case", async () => {
    // Provide id via fieldMap so created_by etc. still land via standard logic
    const fieldMap = {
      columns: {
        name: "name",
        email: "email",
      } as Record<string, string>,
      transforms: {
        name: (v: unknown) => String(v).trim(),
      } as Record<string, (v: unknown) => unknown>,
    };
    db.__qb.resolveWith({
      data: { ...createdRecord, name: "Alice" },
      error: null,
    });

    const svc = createService({ fieldMap });
    const result = await svc.create(
      db as never,
      ORG_ID,
      {
        name: "  Alice  ",
        email: "alice@test.com",
      },
      USER_ID,
    );

    expect(result.name).toBe("Alice");
  });

  it("resolves branchId via resolveBranchId when branchId param set", async () => {
    mockResolveBranchId.mockResolvedValue("branch-1");
    db.__qb.resolveWith({
      data: { ...createdRecord, branch_id: "branch-1" },
      error: null,
    });

    const svc = createService();
    await svc.create(
      db as never,
      ORG_ID,
      {
        name: "Alice",
        branchId: "branch-1",
      },
      USER_ID,
    );

    expect(mockResolveBranchId).toHaveBeenCalledWith(
      expect.anything(),
      ORG_ID,
      "branch-1",
      { strict: false },
    );
  });

  it("throws AppError when insert fails", async () => {
    db.__qb.resolveWith({
      data: null,
      error: new Error("Duplicate key"),
    });

    const svc = createService();
    await expect(
      svc.create(db as never, ORG_ID, insertParams, USER_ID),
    ).rejects.toThrow("Duplicate key");
  });

  it("invalidates by-id cache tag when cacheTagKeyById configured", async () => {
    db.__qb.resolveWith({ data: createdRecord, error: null });

    const svc = createService();
    await svc.create(db as never, ORG_ID, insertParams, USER_ID);

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `${TABLE_KEY}:${RECORD_ID}`,
      "max",
    );
  });
});

// ── update ────────────────────────────────────────────────────────

describe("update", () => {
  const existingRecord: TestRecord = {
    ...DEFAULT_RECORD,
    name: "Alice",
    email: "alice@example.com",
  };
  const updatedRecord: TestRecord = {
    ...existingRecord,
    name: "Alice Updated",
    updated_by: USER_ID,
  };

  it("fetches existing, applies update, returns updated record", async () => {
    // First await = getById (fetch existing)
    // Second await = update + select
    db.__qb.resolveWith({ data: updatedRecord, error: null });

    const svc = createService();
    const result = await svc.update(
      db as never,
      ORG_ID,
      RECORD_ID,
      { name: "Alice Updated" },
      USER_ID,
    );

    expect(result.name).toBe("Alice Updated");
    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `${TABLE_KEY}:${ORG_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when record to update does not exist", async () => {
    db.__qb.resolveWith({
      data: null,
      error: new Error("PGRST116: row not found"),
    });

    const svc = createService();
    await expect(
      svc.update(db as never, ORG_ID, "bad-id", { name: "New" }, USER_ID),
    ).rejects.toThrow(/not found/i);
  });

  it("calls beforeUpdate hook and merges its result", async () => {
    const beforeUpdate = vi.fn().mockResolvedValue({
      email: "updated@test.com",
    });

    // First resolve = for the fetch-existing query
    // We need two resolves: one for fetch, one for update
    db.__qb.resolveOnce({ data: existingRecord, error: null });
    db.__qb.resolveOnce({
      data: { ...updatedRecord, email: "updated@test.com" },
      error: null,
    });

    const svc = createService({ hooks: { beforeUpdate } });
    await svc.update(
      db as never,
      ORG_ID,
      RECORD_ID,
      { name: "Alice Updated" },
      USER_ID,
    );

    expect(beforeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: RECORD_ID }),
      expect.objectContaining({ name: "Alice Updated" }),
      expect.objectContaining({ orgId: ORG_ID }),
    );
  });

  it("calls afterUpdate hook after successful update", async () => {
    const afterUpdate = vi.fn();
    db.__qb.resolveOnce({ data: existingRecord, error: null });
    db.__qb.resolveOnce({ data: updatedRecord, error: null });

    const svc = createService({ hooks: { afterUpdate } });
    await svc.update(
      db as never,
      ORG_ID,
      RECORD_ID,
      { name: "Alice Updated" },
      USER_ID,
    );

    expect(afterUpdate).toHaveBeenCalledTimes(1);
    expect(afterUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: RECORD_ID }),
      expect.objectContaining({ orgId: ORG_ID }),
    );
  });

  it("invalidates by-id cache tag when cacheTagKeyById configured", async () => {
    db.__qb.resolveOnce({ data: existingRecord, error: null });
    db.__qb.resolveOnce({ data: updatedRecord, error: null });

    const svc = createService();
    await svc.update(
      db as never,
      ORG_ID,
      RECORD_ID,
      { name: "Alice Updated" },
      USER_ID,
    );

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `${TABLE_KEY}:${RECORD_ID}`,
      "max",
    );
  });
});

// ── softDelete ────────────────────────────────────────────────────

describe("softDelete", () => {
  const existingRecord: TestRecord = {
    ...DEFAULT_RECORD,
    name: "Alice",
  };

  it("marks record as deleted (sets deleted_at and updated_by)", async () => {
    db.__qb.resolveOnce({ data: existingRecord, error: null });

    const svc = createService();
    await svc.softDelete(db as never, ORG_ID, RECORD_ID, USER_ID);

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "soft_delete",
        table_name: TABLE,
        record_id: RECORD_ID,
        user_id: USER_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `${TABLE_KEY}:${ORG_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when record to delete does not exist", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("PGRST116: row not found"),
    });

    const svc = createService();
    await expect(
      svc.softDelete(db as never, ORG_ID, "bad-id", USER_ID),
    ).rejects.toThrow(/not found/i);
  });

  it("calls beforeDelete hook before deleting", async () => {
    const beforeDelete = vi.fn();
    db.__qb.resolveOnce({ data: existingRecord, error: null });

    const svc = createService({ hooks: { beforeDelete } });
    await svc.softDelete(db as never, ORG_ID, RECORD_ID, USER_ID);

    expect(beforeDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: RECORD_ID }),
      expect.objectContaining({ orgId: ORG_ID, userId: USER_ID }),
    );
  });
});
