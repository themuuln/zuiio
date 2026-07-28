import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    customers: (o: string) => `customers:${o}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  AppError: class extends Error {
    constructor(
      msg: string,
      public code: string,
      public status: number,
    ) {
      super(msg);
      this.name = "AppError";
    }
  },
  ConflictError: class extends Error {
    constructor(
      msg: string,
      public details?: Record<string, unknown>,
    ) {
      super(msg);
      this.name = "ConflictError";
    }
  },
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
  withBranchFilter: vi.fn((q: unknown) => q),
}));
vi.mock("@/lib/supabase/query", () => ({
  withDbCapture: vi.fn((_l: string, p: Promise<unknown>) => p),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { resolveBranchId } from "@/lib/supabase/with-branch";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockResolveBranchId = vi.mocked(resolveBranchId);

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  getCustomersFast,
  getSharedCustomer,
  getSharedCustomers,
  getSharedCustomerVehicles,
  searchCustomers,
  updateCustomer,
} from "../customer-service";

const ORG_ID = "org-1";
const CUSTOMER_ID = "cust-1";
const USER_ID = "user-1";

let db: ReturnType<typeof createMockSupabaseClient>;

function makeCustomer(o: Record<string, unknown> = {}) {
  return {
    id: CUSTOMER_ID,
    organization_id: ORG_ID,
    branch_id: "branch-1",
    first_name: "John",
    last_name: "Doe",
    full_name: "John Doe",
    phone: "+97699111111",
    email: "john@example.com",
    type: "individual",
    company_name: null,
    contact_person: null,
    address: null,
    notes: null,
    source: null,
    tags: [],
    total_visits: 0,
    last_visit_at: null,
    portal_token: null,
    customer_user_id: null,
    created_at: "2025-06-01T10:00:00Z",
    updated_at: "2025-06-01T10:00:00Z",
    created_by: USER_ID,
    updated_by: USER_ID,
    ...o,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  db = createMockSupabaseClient();
});

// ── getCustomers ────────────────────────────────────────────────

describe("getCustomers", () => {
  it("returns paginated customers with vehicle counts", async () => {
    const customers = [makeCustomer({ id: "c1" }), makeCustomer({ id: "c2" })];

    // crud.getAll -> await query.range(...) returns paginated data
    db.__qb.resolveOnce({
      data: customers,
      count: 2,
      error: null,
    });
    // vehicle counts query
    db.__qb.resolveOnce({
      data: [
        { customer_id: "c1" },
        { customer_id: "c1" },
        { customer_id: "c2" },
      ],
      error: null,
    });

    const result = await getCustomers(db as never, ORG_ID);
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.data[0].vehicle_count).toBe(2);
    expect(result.data[1].vehicle_count).toBe(1);
  });

  it("returns zero vehicle counts when no owners found", async () => {
    db.__qb.resolveOnce({
      data: [makeCustomer({ id: "c1" })],
      count: 1,
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getCustomers(db as never, ORG_ID);
    expect(result.data[0].vehicle_count).toBe(0);
  });

  it("handles empty customer list", async () => {
    db.__qb.resolveOnce({
      data: [],
      count: 0,
      error: null,
    });

    const result = await getCustomers(db as never, ORG_ID);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("handles vehicle count query error gracefully", async () => {
    db.__qb.resolveOnce({
      data: [makeCustomer({ id: "c1" })],
      count: 1,
      error: null,
    });
    // Simulate vehicle_owners query error -- should not throw, use 0 counts
    db.__qb.resolveOnce({ data: null, error: new Error("fail") });

    const result = await getCustomers(db as never, ORG_ID);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].vehicle_count).toBe(0);
  });

  it("passes pagination options to crud", async () => {
    db.__qb.resolveOnce({
      data: [makeCustomer()],
      count: 1,
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getCustomers(db as never, ORG_ID, {
      page: 2,
      pageSize: 10,
    });
    expect(result.data).toHaveLength(1);
    expect(result.page).toBe(2);
  });
});

// ── getCustomersFast ────────────────────────────────────────────

describe("getCustomersFast", () => {
  const rpcRow = {
    id: CUSTOMER_ID,
    full_name: "John Doe",
    first_name: "John",
    last_name: "Doe",
    phone: "+97699111111",
    email: "john@example.com",
    company_name: null,
    created_at: "2025-06-01T10:00:00Z",
    last_visit_at: null,
    total_visits: 0,
    total_spent: 0,
    vehicles_count: 2,
  };

  it("returns mapped RPC rows", async () => {
    db.rpc.mockResolvedValue({ data: [rpcRow], error: null });

    const result = await getCustomersFast(db as never, ORG_ID);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(CUSTOMER_ID);
    expect(result[0].vehicle_count).toBe(2);
    expect(result[0].full_name).toBe("John Doe");
  });

  it("passes params to RPC", async () => {
    db.rpc.mockResolvedValue({ data: [rpcRow], error: null });

    await getCustomersFast(db as never, ORG_ID, {
      search: "John",
      limit: 20,
    });

    expect(db.rpc).toHaveBeenCalledWith("get_customers_with_value", {
      p_org_id: ORG_ID,
      p_search: "John",
      p_limit: 20,
      p_offset: 0,
    });
  });

  it("throws on RPC error", async () => {
    db.rpc.mockResolvedValue({ data: null, error: new Error("rpc failed") });

    await expect(getCustomersFast(db as never, ORG_ID)).rejects.toThrow(
      "rpc failed",
    );
  });

  it("returns empty array on null data", async () => {
    db.rpc.mockResolvedValue({ data: null, error: null });

    const result = await getCustomersFast(db as never, ORG_ID);
    expect(result).toEqual([]);
  });
});

// ── getSharedCustomers ──────────────────────────────────────────

describe("getSharedCustomers", () => {
  it("returns paginated shared customers with org names", async () => {
    const sharedCustomer = makeCustomer({
      id: "sc-1",
      organization_id: "org-2",
    });

    // Customers query (range)
    db.__qb.resolveOnce({
      data: [sharedCustomer],
      count: 1,
      error: null,
    });
    // Promise.all -> vehicle counts
    db.__qb.resolveOnce({
      data: [{ customer_id: "sc-1" }],
      error: null,
    });
    // Promise.all -> org names
    db.__qb.resolveOnce({
      data: [{ id: "org-2", name: "Other Org" }],
      error: null,
    });

    const result = await getSharedCustomers(db as never, ORG_ID);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].organization_name).toBe("Other Org");
    expect(result.data[0].vehicle_count).toBe(1);
  });

  it("handles empty result", async () => {
    db.__qb.resolveOnce({ data: [], count: 0, error: null });

    const result = await getSharedCustomers(db as never, ORG_ID);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("throws on query error", async () => {
    db.__qb.resolveOnce({
      data: null,
      count: null,
      error: new Error("db error"),
    });

    await expect(getSharedCustomers(db as never, ORG_ID)).rejects.toThrow(
      "db error",
    );
  });
});

// ── getCustomer ─────────────────────────────────────────────────

describe("getCustomer", () => {
  it("returns a single customer by ID", async () => {
    db.__qb.resolveOnce({ data: makeCustomer(), error: null });

    const result = await getCustomer(db as never, CUSTOMER_ID, ORG_ID);
    expect(result.id).toBe(CUSTOMER_ID);
  });

  it("throws NotFoundError when not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(getCustomer(db as never, "missing", ORG_ID)).rejects.toThrow(
      "not found",
    );
  });

  it("throws on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("db fail") });

    await expect(getCustomer(db as never, CUSTOMER_ID, ORG_ID)).rejects.toThrow(
      "not found",
    );
  });
});

// ── getSharedCustomer ────────────────────────────────────────────

describe("getSharedCustomer", () => {
  it("returns a shared customer with org name", async () => {
    const sharedCustomer = makeCustomer({
      organization_id: "org-2",
      organizations: { name: "Other Org", sharing_enabled: true },
    });

    db.__qb.resolveOnce({ data: sharedCustomer, error: null });

    const result = await getSharedCustomer(db as never, CUSTOMER_ID, ORG_ID);
    expect(result.id).toBe(CUSTOMER_ID);
    expect(result).toHaveProperty("organization_name", "Other Org");
  });

  it("throws NotFoundError when not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      getSharedCustomer(db as never, "missing", ORG_ID),
    ).rejects.toThrow("not found");
  });

  it("throws on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("db fail") });

    await expect(
      getSharedCustomer(db as never, CUSTOMER_ID, ORG_ID),
    ).rejects.toThrow("not found");
  });
});

// ── getSharedCustomerVehicles ────────────────────────────────────

describe("getSharedCustomerVehicles", () => {
  it("returns vehicles for a shared customer", async () => {
    const vehicles = [
      {
        id: "v-1",
        plate_number: "0011УБА",
        make: "Toyota",
        model: "Land Cruiser",
        year: 2020,
      },
    ];

    db.__qb.resolveOnce({ data: vehicles, error: null });

    const result = await getSharedCustomerVehicles(
      db as never,
      CUSTOMER_ID,
      ORG_ID,
    );
    expect(result).toHaveLength(1);
    expect(result[0].plate_number).toBe("0011УБА");
  });

  it("returns empty array on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("fail") });

    const result = await getSharedCustomerVehicles(
      db as never,
      CUSTOMER_ID,
      ORG_ID,
    );
    expect(result).toEqual([]);
  });

  it("returns empty array on null data", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getSharedCustomerVehicles(
      db as never,
      CUSTOMER_ID,
      ORG_ID,
    );
    expect(result).toEqual([]);
  });
});

// ── createCustomer ──────────────────────────────────────────────

describe("createCustomer", () => {
  const params = {
    firstName: "John",
    lastName: "Doe",
    phone: "+97699111111",
    email: "john@example.com",
  };

  it("inserts, audits, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: makeCustomer(), error: null });

    const result = await createCustomer(db as never, ORG_ID, params, USER_ID);
    expect(result.id).toBe(CUSTOMER_ID);
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `customers:${ORG_ID}`,
      "max",
    );
  });

  it("rejects missing all identifying fields", async () => {
    await expect(
      createCustomer(db as never, ORG_ID, {}, USER_ID),
    ).rejects.toThrow("At least one identifying field is required");
  });

  it("rejects empty identifying fields", async () => {
    await expect(
      createCustomer(
        db as never,
        ORG_ID,
        {
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          companyName: "",
          contactPerson: "",
        },
        USER_ID,
      ),
    ).rejects.toThrow("At least one identifying field is required");
  });
});

// ── updateCustomer ──────────────────────────────────────────────

describe("updateCustomer", () => {
  it("fetches, applies fieldMap, updates, audits", async () => {
    // Fetch existing
    db.__qb.resolveOnce({ data: makeCustomer(), error: null });
    // Update result
    db.__qb.resolveOnce({
      data: makeCustomer({
        first_name: "Jane",
        updated_at: "2025-07-01T10:00:00Z",
      }),
      error: null,
    });

    const result = await updateCustomer(
      db as never,
      CUSTOMER_ID,
      ORG_ID,
      { firstName: "Jane" },
      USER_ID,
    );
    expect(result.first_name).toBe("Jane");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `customers:${ORG_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateCustomer(
        db as never,
        "missing",
        ORG_ID,
        { firstName: "N" },
        USER_ID,
      ),
    ).rejects.toThrow("not found");
  });

  it("throws on fetch error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("fetch fail") });

    await expect(
      updateCustomer(
        db as never,
        CUSTOMER_ID,
        ORG_ID,
        { firstName: "N" },
        USER_ID,
      ),
    ).rejects.toThrow("not found");
  });

  it("throws ConflictError on phone duplicate", async () => {
    // Mock maybeSingle to return existing record during beforeUpdate phone check
    // The beforeUpdate hook's phone-duplicate check does:
    //   .from("customers").select("id").eq("organization_id", orgId).eq("phone", phone)
    //   .is("deleted_at", null).neq("id", existing.id).maybeSingle()
    //
    // Since maybeSingle.mockResolvedValue({ data: null, error: null }) is the default,
    // we override it here to simulate a duplicate
    const dupId = "dup-1";
    vi.mocked(db.from("customers").maybeSingle).mockResolvedValueOnce({
      data: { id: dupId },
      error: null,
    });
    // The fetch-existing call uses .single(), not .maybeSingle()
    db.__qb.resolveOnce({ data: makeCustomer(), error: null });

    await expect(
      updateCustomer(
        db as never,
        CUSTOMER_ID,
        ORG_ID,
        { phone: "+97699999999" },
        USER_ID,
      ),
    ).rejects.toThrow("phone number already exists");
  });
});

// ── deleteCustomer ──────────────────────────────────────────────

describe("deleteCustomer", () => {
  it("soft-deletes and invalidates cache", async () => {
    // Fetch existing
    db.__qb.resolveOnce({ data: makeCustomer(), error: null });
    // Soft delete update (no terminal method, returns qb -> thenable)
    db.__qb.resolveOnce({ data: null, error: null });

    await deleteCustomer(db as never, CUSTOMER_ID, ORG_ID, USER_ID);
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `customers:${ORG_ID}`,
      "max",
    );
  });

  it("throws when customer not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      deleteCustomer(db as never, "missing", ORG_ID, USER_ID),
    ).rejects.toThrow("not found");
  });

  it("throws on fetch error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("fetch fail") });

    await expect(
      deleteCustomer(db as never, CUSTOMER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("not found");
  });
});

// ── searchCustomers ─────────────────────────────────────────────

describe("searchCustomers", () => {
  it("delegates to getCustomers with search param", async () => {
    const results = [makeCustomer({ id: "c1" })];
    db.__qb.resolveOnce({ data: results, count: 1, error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await searchCustomers(db as never, ORG_ID, "John");
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("passes pagination and branch options", async () => {
    const results = [makeCustomer({ id: "c1" })];
    db.__qb.resolveOnce({ data: results, count: 1, error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await searchCustomers(db as never, ORG_ID, "John", {
      page: 2,
      pageSize: 10,
      branchId: "branch-2",
    });
    expect(result.data).toHaveLength(1);
  });

  it("returns empty results for no match", async () => {
    db.__qb.resolveOnce({ data: [], count: 0, error: null });

    const result = await searchCustomers(db as never, ORG_ID, "NoMatch");
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
