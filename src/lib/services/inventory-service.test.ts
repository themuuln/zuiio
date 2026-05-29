import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { withCache } from "@/lib/cache/with-cache";
import { revalidateTag } from "next/cache";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { PartsCatalogItem } from "@/lib/types";
import {
  createMovement,
  getInventoryBalances,
  getStockThresholds,
  setStockThreshold,
  getPartsCatalog,
  createPart,
  updatePart,
  deletePart,
} from "./inventory-service";

// ── Module-level mocks ──────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: unknown, fn: () => unknown) => fn()),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

// ── Shared mock client ─────────────────────────────────────────

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

// ── Parts Catalog ──────────────────────────────────────────────

describe("getPartsCatalog", () => {
  it("returns catalog with popularity scores", async () => {
    const mockParts = [
      {
        id: "part-1",
        organization_id: "org-1",
        name: "Oil Filter",
        category: "Filters",
        unit: "piece",
        is_active: true,
        deleted_at: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "part-2",
        organization_id: "org-1",
        name: "Brake Pad",
        category: "Brakes",
        unit: "set",
        is_active: true,
        deleted_at: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
      },
    ];
    // Code counts rows per part_id, not the `count` field value
    const mockAssignments = [
      ...Array.from({ length: 13 }, () => ({ part_id: "part-1", count: 1 })),
      ...Array.from({ length: 5 }, () => ({ part_id: "part-2", count: 1 })),
    ];

    // First query: parts_catalog — eq is not terminal (is() follows), limit ends the chain
    // Second query: vehicle_model_parts — eq IS terminal
    mockClient
      .from("parts_catalog")
      .limit.mockReturnValueOnce(
        Promise.resolve({ data: mockParts, error: null }),
      );
    mockClient
      .from("parts_catalog")
      .eq.mockReturnValueOnce(mockClient.from("parts_catalog")) // parts_catalog eq: return builder for chaining
      .mockReturnValueOnce(
        // vehicle_model_parts eq: terminal call
        Promise.resolve({ data: mockAssignments, error: null }),
      );

    const result = await getPartsCatalog("org-1");

    const items = result as PartsCatalogItem[];
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe("part-1");
    expect(items[1].id).toBe("part-2");
  });

  it("filters by organization_id and deleted_at is null", async () => {
    mockClient
      .from("parts_catalog")
      .limit.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));
    mockClient
      .from("parts_catalog")
      .eq.mockReturnValueOnce(mockClient.from("parts_catalog"))
      .mockReturnValueOnce(Promise.resolve({ data: [], error: null }));

    const result = await getPartsCatalog("org-1");

    expect(result).toEqual([]);
    expect(mockClient.from).toHaveBeenCalledWith("parts_catalog");
    expect(mockClient.from("parts_catalog").is).toHaveBeenCalledWith(
      "deleted_at",
      null,
    );
    expect(mockClient.from("parts_catalog").eq).toHaveBeenCalledWith(
      "organization_id",
      "org-1",
    );
  });

  it("returns empty array when no parts exist", async () => {
    mockClient
      .from("parts_catalog")
      .limit.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));
    mockClient
      .from("parts_catalog")
      .eq.mockReturnValueOnce(mockClient.from("parts_catalog"))
      .mockReturnValueOnce(Promise.resolve({ data: [], error: null }));

    const result = await getPartsCatalog("org-1");

    expect(result).toEqual([]);
  });
});

describe("createPart", () => {
  it("creates a part with valid data", async () => {
    const createdPart = {
      id: "part-1",
      organization_id: "org-1",
      name: "Oil Filter",
      name_mn: null,
      part_number: "OF-123",
      category: "Filters",
      description: null,
      unit: "piece",
      default_price: 15000,
      is_active: true,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
    };

    mockClient.from("parts_catalog").single.mockResolvedValueOnce({
      data: createdPart,
      error: null,
    });

    const result = await createPart(
      "org-1",
      {
        name: "Oil Filter",
        part_number: "OF-123",
        category: "Filters",
        unit: "piece",
        default_price: 15000,
      },
      "user-1",
    );

    expect(result).toEqual(createdPart);
    expect(mockClient.from("parts_catalog").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        name: "Oil Filter",
        part_number: "OF-123",
        category: "Filters",
        unit: "piece",
        default_price: 15000,
        created_by: "user-1",
        updated_by: "user-1",
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      cacheTags.partsCatalog("org-1"),
      "max",
    );
  });

  it("rejects when name is missing", async () => {
    await expect(createPart("org-1", { name: "" }, "user-1")).rejects.toThrow(
      ValidationError,
    );

    await expect(
      createPart("org-1", { name: "   " }, "user-1"),
    ).rejects.toThrow("Part name is required");
  });
});

describe("updatePart", () => {
  const updatedPart = {
    id: "part-1",
    organization_id: "org-1",
    name: "Premium Oil Filter",
    name_mn: null,
    part_number: "OF-123",
    category: "Filters",
    description: null,
    unit: "piece",
    default_price: 18000,
    is_active: true,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-02T00:00:00.000Z",
  };

  it("updates part fields and returns updated part", async () => {
    mockClient.from("parts_catalog").single.mockResolvedValueOnce({
      data: updatedPart,
      error: null,
    });

    const result = await updatePart("part-1", "org-1", {
      name: "Premium Oil Filter",
      default_price: 18000,
    });

    expect(result).toEqual(updatedPart);
    expect(mockClient.from("parts_catalog").update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Premium Oil Filter",
        default_price: 18000,
        updated_by: "test-user-id",
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      cacheTags.partsCatalog("org-1"),
      "max",
    );
  });

  it("throws NotFoundError when part does not exist", async () => {
    mockClient.from("parts_catalog").single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const promise = updatePart("nonexistent", "org-1", { name: "Ghost Part" });

    await expect(promise).rejects.toThrow(NotFoundError);
    await expect(promise).rejects.toThrow("Part not found");
  });
});

describe("deletePart", () => {
  it("soft-deletes a part by setting deleted_at", async () => {
    mockClient.from("parts_catalog").update.mockReturnThis();

    await deletePart("part-1", "org-1");

    const updateCall = mockClient.from("parts_catalog").update.mock.calls[0][0];
    expect(updateCall).toHaveProperty("deleted_at");
    expect(updateCall).toHaveProperty("updated_by", "test-user-id");
    expect(mockClient.from("parts_catalog").eq).toHaveBeenCalledWith(
      "id",
      "part-1",
    );
    expect(mockClient.from("parts_catalog").eq).toHaveBeenCalledWith(
      "organization_id",
      "org-1",
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      cacheTags.partsCatalog("org-1"),
      "max",
    );
  });

  it("throws NotFoundError when soft-deleting non-existent part", async () => {
    // deletePart chains update().eq("id", ...).eq("organization_id", ...)
    // First eq must return builder for chaining, second eq is terminal
    mockClient
      .from("parts_catalog")
      .eq.mockReturnValueOnce(mockClient.from("parts_catalog"))
      .mockReturnValueOnce(
        Promise.resolve({ error: { message: "Not found" } }),
      );

    const promise = deletePart("nonexistent", "org-1");

    await expect(promise).rejects.toThrow(NotFoundError);
    await expect(promise).rejects.toThrow("Part not found");
  });
});

// ── Inventory Balances ─────────────────────────────────────────

describe("getInventoryBalances", () => {
  it("returns balances from inventory_balances table for org", async () => {
    const mockBalances = [
      {
        organization_id: "org-1",
        part_id: "part-1",
        part_name: "Oil Filter",
        part_number: "OF-123",
        quantity_on_hand: 50,
        unit: "piece",
        category: "Filters",
        default_price: 15000,
        last_movement_at: "2025-01-15T10:00:00.000Z",
      },
      {
        organization_id: "org-1",
        part_id: "part-2",
        part_name: "Brake Pad",
        part_number: "BP-001",
        quantity_on_hand: 20,
        unit: "set",
        category: "Brakes",
        default_price: 45000,
        last_movement_at: "2025-01-14T08:00:00.000Z",
      },
    ];

    mockClient
      .from("inventory_balances")
      .eq.mockReturnValueOnce(
        Promise.resolve({ data: mockBalances, error: null }),
      );

    const result = await getInventoryBalances("org-1");

    expect(result).toEqual(mockBalances);
    expect(result).toHaveLength(2);
    expect(mockClient.from).toHaveBeenCalledWith("inventory_balances");
    expect(mockClient.from("inventory_balances").eq).toHaveBeenCalledWith(
      "organization_id",
      "org-1",
    );
  });

  it("returns empty array when no data", async () => {
    mockClient
      .from("inventory_balances")
      .eq.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

    const result = await getInventoryBalances("org-1");

    expect(result).toEqual([]);
  });
});

// ── Inventory Movements ───────────────────────────────────────

describe("createMovement", () => {
  const validMovement = {
    id: "mov-1",
    organization_id: "org-1",
    part_id: "part-1",
    movement_type: "purchase" as const,
    quantity: 10,
    unit_cost: 5000,
    unit_price: null,
    reference_type: null,
    reference_id: null,
    notes: null,
    created_at: "2025-01-01T00:00:00.000Z",
    created_by: "user-1",
  };

  it("creates a valid movement and revalidates cache tags", async () => {
    mockClient.from("parts_catalog").single.mockResolvedValueOnce({
      data: { id: "part-1" },
      error: null,
    });
    mockClient.from("inventory_movements").single.mockResolvedValueOnce({
      data: validMovement,
      error: null,
    });

    const result = await createMovement(
      "org-1",
      {
        part_id: "part-1",
        movement_type: "purchase",
        quantity: 10,
        unit_cost: 5000,
      },
      "user-1",
    );

    expect(result).toEqual(validMovement);
    expect(mockClient.from("inventory_movements").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        part_id: "part-1",
        movement_type: "purchase",
        quantity: 10,
        unit_cost: 5000,
        created_by: "user-1",
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      cacheTags.inventoryMovements("org-1"),
      "max",
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      cacheTags.inventoryBalances("org-1"),
      "max",
    );
  });

  it("rejects when part_id is missing", async () => {
    await expect(
      createMovement(
        "org-1",
        { part_id: "", movement_type: "purchase", quantity: 1 },
        "user-1",
      ),
    ).rejects.toThrow(ValidationError);

    await expect(
      createMovement(
        "org-1",
        { part_id: "", movement_type: "purchase", quantity: 1 },
        "user-1",
      ),
    ).rejects.toThrow("Part is required");
  });

  it("rejects when movement_type is missing", async () => {
    await expect(
      createMovement(
        "org-1",
        // @ts-expect-error - testing runtime validation for missing movement_type
        { part_id: "part-1", quantity: 1 },
        "user-1",
      ),
    ).rejects.toThrow(ValidationError);

    await expect(
      createMovement(
        "org-1",
        // @ts-expect-error - testing runtime validation for missing movement_type
        { part_id: "part-1", quantity: 1 },
        "user-1",
      ),
    ).rejects.toThrow("Movement type is required");
  });

  it("rejects when quantity is zero", async () => {
    await expect(
      createMovement(
        "org-1",
        { part_id: "part-1", movement_type: "purchase", quantity: 0 },
        "user-1",
      ),
    ).rejects.toThrow(ValidationError);

    await expect(
      createMovement(
        "org-1",
        { part_id: "part-1", movement_type: "purchase", quantity: 0 },
        "user-1",
      ),
    ).rejects.toThrow("Quantity must be non-zero");
  });

  it("rejects when part does not exist", async () => {
    mockClient.from("parts_catalog").single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const promise = createMovement(
      "org-1",
      { part_id: "nonexistent", movement_type: "purchase", quantity: 5 },
      "user-1",
    );

    await expect(promise).rejects.toThrow(NotFoundError);
    await expect(promise).rejects.toThrow("Part not found");
  });

  it("successfully creates movement with all optional fields", async () => {
    mockClient.from("parts_catalog").single.mockResolvedValueOnce({
      data: { id: "part-1" },
      error: null,
    });
    mockClient.from("inventory_movements").single.mockResolvedValueOnce({
      data: {
        ...validMovement,
        unit_price: 8000,
        reference_type: "purchase_order",
        reference_id: "po-1",
        notes: "Rush order",
      },
      error: null,
    });

    const result = await createMovement(
      "org-1",
      {
        part_id: "part-1",
        movement_type: "purchase",
        quantity: 10,
        unit_cost: 5000,
        unit_price: 8000,
        reference_type: "purchase_order",
        reference_id: "po-1",
        notes: "Rush order",
      },
      "user-1",
    );

    expect(result.unit_price).toBe(8000);
    expect(result.reference_type).toBe("purchase_order");
    expect(result.reference_id).toBe("po-1");
    expect(result.notes).toBe("Rush order");
  });
});

// ── Stock Thresholds ───────────────────────────────────────────

describe("setStockThreshold", () => {
  const createdThreshold = {
    id: "thresh-1",
    organization_id: "org-1",
    branch_id: null,
    part_id: "part-1",
    minimum_quantity: 10,
    maximum_quantity: null,
    notes: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    created_by: "test-user-id",
    updated_by: "test-user-id",
  };

  it("creates stock threshold with proper org/part/user context", async () => {
    mockClient.from("stock_thresholds").single.mockResolvedValueOnce({
      data: createdThreshold,
      error: null,
    });

    const result = await setStockThreshold("org-1", {
      part_id: "part-1",
      minimum_quantity: 10,
    });

    expect(result).toEqual(createdThreshold);
    expect(mockClient.from("stock_thresholds").upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        part_id: "part-1",
        minimum_quantity: 10,
        created_by: "test-user-id",
        updated_by: "test-user-id",
      }),
      { onConflict: "organization_id, branch_id, part_id" },
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      cacheTags.stockThresholds("org-1"),
      "max",
    );
  });

  it("rejects when part_id is missing", async () => {
    await expect(
      setStockThreshold("org-1", { part_id: "", minimum_quantity: 10 }),
    ).rejects.toThrow(ValidationError);

    await expect(
      setStockThreshold("org-1", { part_id: "", minimum_quantity: 10 }),
    ).rejects.toThrow("Part is required");
  });
});

describe("getStockThresholds", () => {
  it("returns thresholds for org", async () => {
    const mockThresholds = [
      {
        id: "thresh-1",
        organization_id: "org-1",
        branch_id: null,
        part_id: "part-1",
        minimum_quantity: 10,
        maximum_quantity: 100,
        notes: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        created_by: "user-1",
        updated_by: "user-1",
      },
      {
        id: "thresh-2",
        organization_id: "org-1",
        branch_id: "branch-1",
        part_id: "part-2",
        minimum_quantity: 5,
        maximum_quantity: null,
        notes: "Low stock warning",
        created_at: "2025-01-02T00:00:00.000Z",
        updated_at: "2025-01-02T00:00:00.000Z",
        created_by: "user-1",
        updated_by: "user-1",
      },
    ];

    mockClient
      .from("stock_thresholds")
      .eq.mockReturnValueOnce(
        Promise.resolve({ data: mockThresholds, error: null }),
      );

    const result = await getStockThresholds("org-1");

    expect(result).toEqual(mockThresholds);
    expect(result).toHaveLength(2);
    expect(mockClient.from("stock_thresholds").eq).toHaveBeenCalledWith(
      "organization_id",
      "org-1",
    );
  });

  it("returns empty array when no thresholds exist", async () => {
    mockClient
      .from("stock_thresholds")
      .eq.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

    const result = await getStockThresholds("org-1");

    expect(result).toEqual([]);
  });
});
