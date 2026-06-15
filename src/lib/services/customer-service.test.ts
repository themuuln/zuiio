import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  searchCustomers,
  updateCustomer,
} from "./customer-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key, fn) => fn()),
}));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

// Helper to create a typed mock client for tests.
// The mock client has a permissive `from` return type so chainable query builder
// methods (single, maybeSingle, range, or, etc.) are available without errors.
// The `as SupabaseClient` cast is applied only when passing to service functions.
function createTestMockClient() {
  return createMockSupabaseClient() as unknown as {
    from: (table: string) => any;
    auth: any;
    rpc: any;
    supabaseUrl: string;
    supabaseKey: string;
    realtime: any;
    realtimeUrl: string;
    rest: any;
    storage: any;
    channel: any;
    removeChannel: any;
    getChannels: any;
    functions: any;
    __qb: any;
  };
}

describe("createCustomer", () => {
  const mockClient = createTestMockClient();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  });

  it("creates a customer with valid data", async () => {
    mockClient
      .from("customers")
      .maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockClient.from("customers").select.mockReturnThis();
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: { id: "cust-1", first_name: "Bat", phone: "99112233" },
      error: null,
    });

    const result = await createCustomer(
      mockClient as unknown as SupabaseClient,
      "org-1",
      { firstName: "Bat", phone: "99112233" },
      "user-1",
    );

    expect(result.first_name).toBe("Bat");
    expect(createAuditLog).toHaveBeenCalled();
  });

  it("warns on duplicate phone but still creates customer", async () => {
    mockClient.from("customers").maybeSingle.mockResolvedValueOnce({
      data: {
        id: "existing-id",
        first_name: "Existing",
        last_name: null,
        company_name: null,
        phone: "99112233",
      },
      error: null,
    });

    // Mock the insert flow
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: { id: "cust-new", first_name: "Dul", phone: "99112233" },
      error: null,
    });

    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

    const result = await createCustomer(
      mockClient as unknown as SupabaseClient,
      "org-1",
      { firstName: "Dul", phone: "99112233" },
      "user-1",
    );

    expect(result.first_name).toBe("Dul");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining("99112233"),
    );
    warnSpy.mockRestore();
  });

  it("validates that at least one identifying field is required", async () => {
    await expect(
      createCustomer(
        mockClient as unknown as SupabaseClient,
        "org-1",
        { firstName: "" },
        "user-1",
      ),
    ).rejects.toThrow("At least one identifying field");
  });
});

describe("getCustomer", () => {
  const mockClient = createTestMockClient();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  });

  it("returns customer data when found", async () => {
    const mockCustomer = {
      id: "c1",
      organization_id: "org-1",
      first_name: "Bat",
      phone: "99112233",
    };

    mockClient.from("customers").single.mockResolvedValueOnce({
      data: mockCustomer,
      error: null,
    });

    const result = await getCustomer(
      mockClient as unknown as SupabaseClient,
      "c1",
      "org-1",
    );

    expect(result.id).toBe("c1");
    expect(result.first_name).toBe("Bat");
  });

  it("throws NotFoundError when customer not found", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: null,
      error: { message: "not found" },
    });

    await expect(
      getCustomer(
        mockClient as unknown as SupabaseClient,
        "nonexistent",
        "org-1",
      ),
    ).rejects.toThrow("customers not found");
  });
});

describe("getCustomers", () => {
  const mockClient = createTestMockClient();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  });

  it("returns all customers for org filtered by deleted_at is null", async () => {
    const mockCustomers = [
      {
        id: "c1",
        organization_id: "org-1",
        first_name: "Bat",
        phone: "99112233",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "c2",
        organization_id: "org-1",
        first_name: "Dul",
        phone: "99223344",
        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    mockClient.from("customers").range.mockResolvedValueOnce({
      data: mockCustomers,
      count: 2,
      error: null,
    });

    const result = await getCustomers(
      mockClient as unknown as SupabaseClient,
      "org-1",
    );

    expect(result.data).toHaveLength(2);
    expect(result.data[0].first_name).toBe("Bat");
    expect(result.data[1].first_name).toBe("Dul");
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("supports search parameter", async () => {
    const mockCustomers = [
      {
        id: "c1",
        organization_id: "org-1",
        first_name: "Bat",
        phone: "99112233",
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockClient.from("customers").range.mockResolvedValueOnce({
      data: mockCustomers,
      count: 1,
      error: null,
    });

    const result = await getCustomers(
      mockClient as unknown as SupabaseClient,
      "org-1",
      { search: "Bat" },
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].first_name).toBe("Bat");
    expect(mockClient.from("customers").or).toHaveBeenCalled();
  });

  it("enriches with vehicle_count from vehicle_owners", async () => {
    const mockCustomers = [
      {
        id: "c1",
        organization_id: "org-1",
        first_name: "Bat",
        phone: "99112233",
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockClient.from("customers").range.mockResolvedValueOnce({
      data: mockCustomers,
      count: 1,
      error: null,
    });

    const result = await getCustomers(
      mockClient as unknown as SupabaseClient,
      "org-1",
    );

    expect(result.data[0]).toHaveProperty("vehicle_count");
  });

  it("returns empty array when no customers", async () => {
    mockClient.from("customers").range.mockResolvedValueOnce({
      data: [],
      count: 0,
      error: null,
    });

    const result = await getCustomers(
      mockClient as unknown as SupabaseClient,
      "org-1",
    );

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("respects page and pageSize options", async () => {
    const mockCustomers = [
      {
        id: "c1",
        organization_id: "org-1",
        first_name: "Bat",
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockClient.from("customers").range.mockResolvedValueOnce({
      data: mockCustomers,
      count: 10,
      error: null,
    });

    const result = await getCustomers(
      mockClient as unknown as SupabaseClient,
      "org-1",
      {
        page: 2,
        pageSize: 5,
      },
    );

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(5);
    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(2);
  });
});

describe("updateCustomer", () => {
  const mockClient = createTestMockClient();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  });

  it("updates customer fields (type, first_name, last_name, phone, email, address, notes)", async () => {
    const existingCustomer = {
      id: "c1",
      organization_id: "org-1",
      first_name: "Bat",
      last_name: null,
      phone: "99112233",
      email: null,
      address: null,
      notes: null,
      type: "individual",
    };

    const updatedCustomer = {
      ...existingCustomer,
      first_name: "Bat",
      last_name: "Munkh",
      phone: "99112233",
      email: "bat@test.mn",
      address: "UB",
      notes: "VIP",
    };

    mockClient
      .from("customers")
      .single.mockResolvedValueOnce({ data: existingCustomer, error: null })
      .mockResolvedValueOnce({ data: updatedCustomer, error: null });

    const result = await updateCustomer(
      mockClient as unknown as SupabaseClient,
      "c1",
      "org-1",
      {
        firstName: "Bat",
        lastName: "Munkh",
        phone: "99112233",
        email: "bat@test.mn",
        address: "UB",
        notes: "VIP",
      },
      "user-1",
    );

    expect(result.first_name).toBe("Bat");
    expect(result.last_name).toBe("Munkh");
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "customers",
        record_id: "c1",
        old_data: expect.any(Object),
        new_data: expect.any(Object),
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      expect.stringContaining("customers"),
      "max",
    );
  });

  it("throws NotFoundError when customer doesn't exist", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      updateCustomer(
        mockClient as unknown as SupabaseClient,
        "nonexistent",
        "org-1",
        { firstName: "Test" },
        "user-1",
      ),
    ).rejects.toThrow("customers not found");
  });

  it("throws ValidationError when only updated_by is set", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: { id: "c1", organization_id: "org-1", first_name: "Bat" },
      error: null,
    });

    await expect(
      updateCustomer(
        mockClient as unknown as SupabaseClient,
        "c1",
        "org-1",
        {},
        "user-1",
      ),
    ).rejects.toThrow("No fields to update");
  });

  it("creates audit log with old_data and new_data", async () => {
    const existingCustomer = {
      id: "c1",
      organization_id: "org-1",
      first_name: "Bat",
      last_name: null,
      phone: "99112233",
      type: "individual",
    };

    const updatedCustomer = {
      ...existingCustomer,
      last_name: "Dorj",
    };

    mockClient
      .from("customers")
      .single.mockResolvedValueOnce({ data: existingCustomer, error: null })
      .mockResolvedValueOnce({ data: updatedCustomer, error: null });

    await updateCustomer(
      mockClient as unknown as SupabaseClient,
      "c1",
      "org-1",
      { lastName: "Dorj" },
      "user-1",
    );

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "customers",
        record_id: "c1",
        old_data: expect.objectContaining({
          first_name: "Bat",
          last_name: null,
        }),
        new_data: expect.objectContaining({
          first_name: "Bat",
          last_name: "Dorj",
        }),
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      expect.stringContaining("customers"),
      "max",
    );
  });

  it("revalidates customers cache tag", async () => {
    const existingCustomer = {
      id: "c1",
      organization_id: "org-1",
      first_name: "Bat",
      type: "individual",
    };

    mockClient
      .from("customers")
      .single.mockResolvedValueOnce({ data: existingCustomer, error: null })
      .mockResolvedValueOnce({
        data: { ...existingCustomer, last_name: "Test" },
        error: null,
      });

    await updateCustomer(
      mockClient as unknown as SupabaseClient,
      "c1",
      "org-1",
      { lastName: "Test" },
      "user-1",
    );

    expect(revalidateTag).toHaveBeenCalledWith(
      expect.stringContaining("customers"),
      "max",
    );
  });
});

describe("deleteCustomer", () => {
  const mockClient = createTestMockClient();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  });

  it("soft deletes by setting deleted_at and updated_by", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: { id: "c1" },
      error: null,
    });

    await deleteCustomer(
      mockClient as unknown as SupabaseClient,
      "c1",
      "org-1",
      "user-1",
    );

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "soft_delete",
        record_id: "c1",
      }),
    );
  });

  it("throws NotFoundError when customer not found", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      deleteCustomer(
        mockClient as unknown as SupabaseClient,
        "nonexistent",
        "org-1",
        "user-1",
      ),
    ).rejects.toThrow("customers not found");
  });

  it("creates audit log for soft_delete", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: { id: "c1" },
      error: null,
    });

    await deleteCustomer(
      mockClient as unknown as SupabaseClient,
      "c1",
      "org-1",
      "user-1",
    );

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "soft_delete",
        table_name: "customers",
        record_id: "c1",
        user_id: "user-1",
        organization_id: "org-1",
      }),
    );
  });

  it("revalidates customers cache tag", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: { id: "c1" },
      error: null,
    });

    await deleteCustomer(
      mockClient as unknown as SupabaseClient,
      "c1",
      "org-1",
      "user-1",
    );

    expect(revalidateTag).toHaveBeenCalledWith(
      expect.stringContaining("customers"),
      "max",
    );
  });
});

describe("searchCustomers", () => {
  const mockClient = createTestMockClient();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
    );
  });

  it("delegates to getCustomers with search param", async () => {
    const mockCustomers = [
      {
        id: "c1",
        organization_id: "org-1",
        first_name: "Bat",
        phone: "99112233",
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockClient.from("customers").range.mockResolvedValueOnce({
      data: mockCustomers,
      count: 1,
      error: null,
    });

    const result = await searchCustomers(
      mockClient as unknown as SupabaseClient,
      "org-1",
      "Bat",
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].first_name).toBe("Bat");
    expect(mockClient.from("customers").or).toHaveBeenCalledWith(
      expect.stringContaining("Bat"),
    );
  });

  it("returns matching results from getCustomers", async () => {
    const mockCustomers = [
      {
        id: "c1",
        organization_id: "org-1",
        first_name: "Bat",
        phone: "99112233",
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockClient.from("customers").range.mockResolvedValueOnce({
      data: mockCustomers,
      count: 1,
      error: null,
    });

    const result = await searchCustomers(
      mockClient as unknown as SupabaseClient,
      "org-1",
      "Bat",
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].phone).toBe("99112233");
  });
});
