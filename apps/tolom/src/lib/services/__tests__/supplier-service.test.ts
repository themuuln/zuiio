import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  AppError: class extends Error {
    constructor(
      m: string,
      public code?: string,
      public status?: number,
    ) {
      super(m);
      this.name = "AppError";
    }
  },
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { AppError, NotFoundError, ValidationError } from "@/lib/errors";
import { resolveBranchId } from "@/lib/supabase/with-branch";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockResolveBranchId = vi.mocked(resolveBranchId);

import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from "../supplier-service";

// ── Shared constants ──────────────────────────────────────────────

const ORG_ID = "org-1";
const USER_ID = "user-1";
const SUPPLIER_ID = "supp-1";

let db: MockSupabaseClient;

// ── Helpers ───────────────────────────────────────────────────────

function makeSupplier(overrides: Record<string, unknown> = {}) {
  return {
    id: SUPPLIER_ID,
    organization_id: ORG_ID,
    name: "Test Supplier",
    contact_person: "John Doe",
    phone: "+976-99112233",
    email: "john@supplier.com",
    address: "123 Main St",
    tax_id: "TAX-001",
    payment_terms: "Net 30",
    notes: "Reliable supplier",
    is_active: true,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
    created_by: USER_ID,
    updated_by: USER_ID,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── getSuppliers ──────────────────────────────────────────────────

describe("getSuppliers", () => {
  it("returns paginated list of suppliers", async () => {
    const suppliers = [
      makeSupplier({ id: "s1", name: "Alpha Supplies" }),
      makeSupplier({ id: "s2", name: "Beta Parts" }),
    ];
    db.__qb.resolveWith({ data: suppliers, count: 2, error: null });

    const result = await getSuppliers(db as never, ORG_ID, 1, 10);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it("uses default page=1 and pageSize=50 when not provided", async () => {
    db.__qb.resolveWith({ data: [], count: 0, error: null });

    const result = await getSuppliers(db as never, ORG_ID);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
  });

  it("clamps pageSize to max of 100", async () => {
    db.__qb.resolveWith({ data: [], count: 0, error: null });

    const result = await getSuppliers(db as never, ORG_ID, 1, 500);

    expect(result.pageSize).toBe(100);
  });

  it("throws AppError on database error", async () => {
    db.__qb.resolveWith({
      data: null,
      count: null,
      error: new Error("Connection failed"),
    });

    await expect(getSuppliers(db as never, ORG_ID)).rejects.toThrow(AppError);
  });
});

// ── getSupplier ───────────────────────────────────────────────────

describe("getSupplier", () => {
  it("returns a single supplier by id", async () => {
    const supplier = makeSupplier({ name: "Acme Corp" });
    db.__qb.resolveOnce({ data: supplier, error: null });

    const result = await getSupplier(db as never, SUPPLIER_ID, ORG_ID);

    expect(result).toBeDefined();
    expect(result.id).toBe(SUPPLIER_ID);
    expect(result.name).toBe("Acme Corp");
    expect(result.email).toBe("john@supplier.com");
  });

  it("throws NotFoundError when supplier does not exist", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("PGRST116: row not found"),
    });

    await expect(
      getSupplier(db as never, "non-existent", ORG_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when data is null without DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(getSupplier(db as never, "ghost", ORG_ID)).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ── createSupplier ────────────────────────────────────────────────

describe("createSupplier", () => {
  const createParams = {
    name: "New Supplier",
    contact_person: "Jane Doe",
    phone: "+976-99445566",
    email: "jane@supplier.com",
    address: "456 Oak Ave",
    tax_id: "TAX-002",
    payment_terms: "Net 60",
    notes: "Preferred vendor",
  };

  it("creates and returns the supplier with audit log and cache invalidation", async () => {
    const created = makeSupplier({ ...createParams });
    db.__qb.resolveOnce({ data: created, error: null });

    const result = await createSupplier(
      db as never,
      ORG_ID,
      createParams,
      USER_ID,
    );

    expect(result).toBeDefined();
    expect(result.name).toBe("New Supplier");
    expect(result.email).toBe("jane@supplier.com");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("resolves branchId when branchId is provided in params", async () => {
    const created = makeSupplier({
      ...createParams,
      branch_id: "branch-1",
    });
    db.__qb.resolveOnce({ data: created, error: null });

    await createSupplier(
      db as never,
      ORG_ID,
      { ...createParams, branchId: "branch-1" },
      USER_ID,
    );

    expect(mockResolveBranchId).toHaveBeenCalled();
  });

  it("throws ValidationError when name is empty string", async () => {
    await expect(
      createSupplier(db as never, ORG_ID, { name: "" }, USER_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when name is only whitespace", async () => {
    await expect(
      createSupplier(db as never, ORG_ID, { name: "   " }, USER_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("throws AppError when database insert fails", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("duplicate key value violates unique constraint"),
    });

    await expect(
      createSupplier(db as never, ORG_ID, createParams, USER_ID),
    ).rejects.toThrow(AppError);
  });
});

// ── updateSupplier ────────────────────────────────────────────────

describe("updateSupplier", () => {
  it("updates and returns the supplier with audit log and cache invalidation", async () => {
    const existing = makeSupplier();
    const updated = makeSupplier({ name: "Updated Corp" });
    db.__qb.resolveOnce({ data: existing, error: null });
    db.__qb.resolveOnce({ data: updated, error: null });

    const result = await updateSupplier(
      db as never,
      SUPPLIER_ID,
      ORG_ID,
      { name: "Updated Corp" },
      USER_ID,
    );

    expect(result).toBeDefined();
    expect(result.name).toBe("Updated Corp");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError when supplier to update does not exist", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("PGRST116: row not found"),
    });

    await expect(
      updateSupplier(
        db as never,
        "non-existent",
        ORG_ID,
        { name: "New" },
        USER_ID,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when fetch returns null without error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateSupplier(db as never, "ghost", ORG_ID, { name: "New" }, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when no fields are provided to update", async () => {
    const existing = makeSupplier();
    db.__qb.resolveOnce({ data: existing, error: null });

    await expect(
      updateSupplier(db as never, SUPPLIER_ID, ORG_ID, {}, USER_ID),
    ).rejects.toThrow(ValidationError);
  });
});

// ── deleteSupplier ────────────────────────────────────────────────

describe("deleteSupplier", () => {
  it("soft-deletes the supplier with audit log and cache invalidation", async () => {
    const existing = makeSupplier();
    db.__qb.resolveOnce({ data: existing, error: null });

    await deleteSupplier(db as never, SUPPLIER_ID, ORG_ID, USER_ID);

    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError when supplier to delete does not exist", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("PGRST116: row not found"),
    });

    await expect(
      deleteSupplier(db as never, "non-existent", ORG_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when fetch returns null without error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      deleteSupplier(db as never, "ghost", ORG_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws AppError when database update during soft-delete fails", async () => {
    const existing = makeSupplier();
    db.__qb.resolveOnce({ data: existing, error: null });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Database update failed"),
    });

    await expect(
      deleteSupplier(db as never, SUPPLIER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow(AppError);
  });
});
