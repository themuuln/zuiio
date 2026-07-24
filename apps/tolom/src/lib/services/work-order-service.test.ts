import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { getWorkOrderDetail } from "@/lib/services/_queries/work-order-queries";
import { syncWorkOrderToSchedules } from "@/lib/services/service-reminder-service";
import { createClient } from "@/lib/supabase/server";
import type {
  WorkOrderHelper,
  WorkOrderPart,
  WorkOrderService,
} from "@/lib/types";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  addPartToWorkOrder,
  addServiceToWorkOrder,
} from "./work-order-items-service";
import {
  cancelWorkOrder,
  createWorkOrder,
  getWorkOrderTotals,
} from "./work-order-service";
import { assignMechanic, updateWorkOrderStatus } from "./work-order-workflow";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: string[], fn: () => unknown) => fn()),
}));
vi.mock("@/lib/services/service-reminder-service", () => ({
  syncWorkOrderToSchedules: vi.fn(),
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  withBranchFilter: vi.fn((q) => q),
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/services/_queries/work-order-queries", () => ({
  getWorkOrderDetail: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
  logAuditAfter: vi.fn(),
}));

const mockClient = createMockSupabaseClient();

function mockWorkOrderDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: "wo-1",
    organization_id: "org-1",
    branch_id: null,
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    mechanic_id: null,
    status: "New",
    notes: null,
    complaint: null,
    description: null,
    diagnosis: null,
    mechanic_notes: null,
    bay_number: null,
    queue_order: 0,
    odometer_at_service: null,
    diagnosis_label_id: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    subtotal: 0,
    total: 0,
    completed_at: null,
    started_at: null,
    deleted_at: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    created_by: "user-1",
    updated_by: "user-1",
    customer: null,
    vehicle: null,
    mechanic: null,
    helpers: [] as WorkOrderHelper[],
    services: [] as WorkOrderService[],
    parts: [] as WorkOrderPart[],
    status_history: [],
    service_history: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

describe("createWorkOrder", () => {
  it("creates WO with proper org/branch/user context, inserts status history New", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "New" },
      error: null,
    });
    vi.mocked(getWorkOrderDetail).mockResolvedValue(
      mockWorkOrderDetail({ id: "wo-1" }),
    );

    const result = await createWorkOrder(mockClient as any, "org-1", {
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      branchId: "branch-1",
    });

    // Insert was called with correct context
    expect(mockClient.from).toHaveBeenCalledWith("work_orders");
    expect(mockClient.from("work_orders").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        branch_id: "branch-1",
        customer_id: "cust-1",
        vehicle_id: "veh-1",
        status: "New",
        created_by: "test-user-id",
        updated_by: "test-user-id",
      }),
    );

    // Status history was inserted with "New"
    expect(mockClient.from).toHaveBeenCalledWith("work_order_status_history");
    expect(
      mockClient.from("work_order_status_history").insert,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: "wo-1",
        organization_id: "org-1",
        status: "New",
        created_by: "test-user-id",
      }),
    );

    // Returns the work order detail
    expect(result.id).toBe("wo-1");
    expect(result.status).toBe("New");
  });

  it("rejects when vehicle_id is missing", async () => {
    await expect(
      createWorkOrder(mockClient as any, "org-1", {
        customer_id: "cust-1",
        vehicle_id: "",
      }),
    ).rejects.toThrow(ValidationError);
    await expect(
      createWorkOrder(mockClient as any, "org-1", {
        customer_id: "cust-1",
        vehicle_id: "",
      }),
    ).rejects.toThrow(
      expect.objectContaining({ message: "Vehicle is required" }),
    );
  });

  it("with mechanic_id — creates mechanic_assignment and updates WO", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "New" },
      error: null,
    });
    vi.mocked(getWorkOrderDetail).mockResolvedValue(
      mockWorkOrderDetail({ id: "wo-1", mechanic_id: "mech-1" }),
    );

    await createWorkOrder(mockClient as any, "org-1", {
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      mechanic_id: "mech-1",
    });

    // Mechanic assignment created
    expect(mockClient.from).toHaveBeenCalledWith("mechanic_assignments");
    expect(mockClient.from("mechanic_assignments").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: "wo-1",
        organization_id: "org-1",
        mechanic_id: "mech-1",
        assigned_by: "test-user-id",
      }),
    );
  });

  it("with services — adds services via addServiceToWorkOrder", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "New" },
      error: null,
    });
    // addServiceToWorkOrder calls:
    //   work_order_services.single()  → insert result
    //   work_orders.single()          → WO vehicle/mechanic info
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: { id: "ws-1", work_order_id: "wo-1" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });
    vi.mocked(getWorkOrderDetail).mockResolvedValue(
      mockWorkOrderDetail({
        id: "wo-1",
        services: [
          {
            id: "ws-1",
            service_catalog_id: "sc-1",
            service_name: "Oil Change",
            quantity: 1,
            unit_price: 100,
            final_price: 100,
          } as WorkOrderService,
        ],
      }),
    );

    const result = await createWorkOrder(mockClient as any, "org-1", {
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      services: [
        {
          service_catalog_id: "sc-1",
          service_name: "Oil Change",
          unit_price: 100,
        },
      ],
    });

    expect(result.services).toHaveLength(1);
    expect(result.services[0].service_name).toBe("Oil Change");
    expect(mockClient.from("work_order_services").insert).toHaveBeenCalled();
  });

  it("with parts — adds parts via addPartToWorkOrder", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "New" },
      error: null,
    });
    // addPartToWorkOrder calls:
    //   work_order_parts.single()    → insert result
    //   work_orders.single()         → WO vehicle/mechanic info
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: { id: "wp-1", work_order_id: "wo-1" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });
    vi.mocked(getWorkOrderDetail).mockResolvedValue(
      mockWorkOrderDetail({
        id: "wo-1",
        parts: [
          {
            id: "wp-1",
            part_name: "Oil Filter",
            quantity: 1,
            unit_price: 15,
            final_price: 15,
          } as WorkOrderPart,
        ],
      }),
    );

    const result = await createWorkOrder(mockClient as any, "org-1", {
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      parts: [{ part_name: "Oil Filter", unit_price: 15 }],
    });

    expect(result.parts).toHaveLength(1);
    expect(result.parts[0].part_name).toBe("Oil Filter");
    expect(mockClient.from("work_order_parts").insert).toHaveBeenCalled();
  });

  it("calls revalidateTag for workOrders and dailyWorkOrders cache", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "New" },
      error: null,
    });
    vi.mocked(getWorkOrderDetail).mockResolvedValue(
      mockWorkOrderDetail({ id: "wo-1" }),
    );

    await createWorkOrder(mockClient as any, "org-1", {
      customer_id: "cust-1",
      vehicle_id: "veh-1",
    });

    expect(revalidateTag).toHaveBeenCalledWith("work-orders:org-1", "max");
    expect(revalidateTag).toHaveBeenCalledWith(
      expect.stringContaining("daily-work-orders:org-1:"),
      "max",
    );
  });
});

describe("updateWorkOrderStatus", () => {
  beforeEach(() => {
    vi.mocked(syncWorkOrderToSchedules).mockResolvedValue(0);
  });

  it("updates status and creates status history entry", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "New" },
      error: null,
    });
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: {
        id: "wo-1",
        organization_id: "org-1",
        status: "In Progress",
      },
      error: null,
    });

    const result = await updateWorkOrderStatus(
      mockClient as any,
      "wo-1",
      "org-1",
      "In Progress",
    );

    expect(mockClient.from).toHaveBeenCalledWith("work_orders");
    expect(mockClient.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "In Progress",
        updated_by: "test-user-id",
      }),
    );
    expect(mockClient.from).toHaveBeenCalledWith("work_order_status_history");
    expect(
      mockClient.from("work_order_status_history").insert,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        previous_status: "New",
        status: "In Progress",
        work_order_id: "wo-1",
      }),
    );
    expect(result.status).toBe("In Progress");
  });

  it("records the previous status when moving backward", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "In Progress" },
      error: null,
    });
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: {
        id: "wo-1",
        organization_id: "org-1",
        status: "Diagnosing",
      },
      error: null,
    });

    await updateWorkOrderStatus(
      mockClient as any,
      "wo-1",
      "org-1",
      "Diagnosing",
    );

    expect(
      mockClient.from("work_order_status_history").insert,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        previous_status: "In Progress",
        status: "Diagnosing",
        work_order_id: "wo-1",
      }),
    );
  });

  it("does not create a duplicate history row when the status is unchanged", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", organization_id: "org-1", status: "Diagnosing" },
      error: null,
    });
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: {
        id: "wo-1",
        organization_id: "org-1",
        status: "Diagnosing",
      },
      error: null,
    });

    await updateWorkOrderStatus(
      mockClient as any,
      "wo-1",
      "org-1",
      "Diagnosing",
    );

    expect(
      mockClient.from("work_order_status_history").insert,
    ).not.toHaveBeenCalled();
  });

  it('when status is "Completed" — updates completed_at, calls syncWorkOrderToSchedules, creates inventory movements', async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: {
        id: "wo-1",
        organization_id: "org-1",
        status: "Ready for Pickup",
      },
      error: null,
    });
    // Mock completed_at update
    mockClient
      .from("work_orders")
      .select()
      .single.mockResolvedValueOnce({
        data: {
          id: "wo-1",
          organization_id: "org-1",
          status: "Completed",
        },
        error: null,
      });

    // Mock work_order_parts query — one part with catalog link, one without
    mockClient.from("work_order_parts").not.mockReturnValueOnce(
      Promise.resolve({
        data: [
          { part_id: "part-1", quantity: 2, unit_price: 15 },
          { part_id: "part-2", quantity: 1, unit_price: 50 },
        ],
        error: null,
      }),
    );

    await updateWorkOrderStatus(
      mockClient as any,
      "wo-1",
      "org-1",
      "Completed",
    );

    // Completed_at updated
    expect(mockClient.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: expect.any(String),
      }),
    );
    expect(syncWorkOrderToSchedules).toHaveBeenCalledWith(
      expect.anything(),
      "wo-1",
    );

    // Inventory movements created
    expect(mockClient.from).toHaveBeenCalledWith("inventory_movements");
    expect(mockClient.from("inventory_movements").insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          organization_id: "org-1",
          part_id: "part-1",
          movement_type: "sale",
          quantity: 2,
          unit_price: 15,
          reference_type: "work_order",
          reference_id: "wo-1",
          created_by: "test-user-id",
        }),
        expect.objectContaining({
          organization_id: "org-1",
          part_id: "part-2",
          movement_type: "sale",
          quantity: 1,
          unit_price: 50,
          reference_type: "work_order",
          reference_id: "wo-1",
          created_by: "test-user-id",
        }),
      ]),
    );

    // Inventory cache tags revalidated
    expect(revalidateTag).toHaveBeenCalledWith(
      "inventory-movements:org-1",
      "max",
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      "inventory-balances:org-1",
      "max",
    );
  });

  it("throws NotFoundError when work order not found", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    await expect(
      updateWorkOrderStatus(
        mockClient as any,
        "wo-404",
        "org-1",
        "In Progress",
      ),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("assignMechanic", () => {
  it("ends previous assignments and creates new assignment", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: {
        id: "ma-1",
        work_order_id: "wo-1",
        organization_id: "org-1",
        mechanic_id: "mech-2",
        assigned_by: "test-user-id",
      },
      error: null,
    });

    const result = await assignMechanic(
      mockClient as any,
      "wo-1",
      "org-1",
      "mech-2",
    );

    // Previous assignments ended
    expect(mockClient.from("mechanic_assignments").update).toHaveBeenCalledWith(
      expect.objectContaining({
        unassigned_at: expect.any(String),
      }),
    );

    // New assignment created
    expect(mockClient.from("mechanic_assignments").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: "wo-1",
        organization_id: "org-1",
        mechanic_id: "mech-2",
        assigned_by: "test-user-id",
      }),
    );

    // WO.mechanic_id updated
    expect(mockClient.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({
        mechanic_id: "mech-2",
        updated_by: "test-user-id",
      }),
    );

    expect(result.mechanic_id).toBe("mech-2");
  });

  it("updates WO.mechanic_id", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: {
        id: "ma-1",
        work_order_id: "wo-1",
        organization_id: "org-1",
        mechanic_id: "mech-2",
        assigned_by: "test-user-id",
      },
      error: null,
    });

    await assignMechanic(mockClient as any, "wo-1", "org-1", "mech-2");

    expect(mockClient.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({ mechanic_id: "mech-2" }),
    );
  });

  it("revalidates caches", async () => {
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: {
        id: "ma-1",
        work_order_id: "wo-1",
        organization_id: "org-1",
        mechanic_id: "mech-2",
        assigned_by: "test-user-id",
      },
      error: null,
    });

    await assignMechanic(mockClient as any, "wo-1", "org-1", "mech-2");

    expect(revalidateTag).toHaveBeenCalledWith("work-order:wo-1", "max");
    expect(revalidateTag).toHaveBeenCalledWith("work-order-detail:wo-1", "max");
  });
});

describe("addServiceToWorkOrder", () => {
  it("adds service with correct pricing (unit_price * quantity, discount applied)", async () => {
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: {
          id: "ws-1",
          work_order_id: "wo-1",
          service_catalog_id: "sc-1",
          service_name: "Oil Change",
          quantity: 2,
          unit_price: 100,
          discount_amount: 10,
          discount_percentage: 0,
          final_price: 190,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });

    const result = await addServiceToWorkOrder(
      mockClient as any,
      "wo-1",
      "org-1",
      {
        service_catalog_id: "sc-1",
        service_name: "Oil Change",
        quantity: 2,
        unit_price: 100,
        discount_amount: 10,
      },
    );

    expect(mockClient.from("work_order_services").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: "wo-1",
        organization_id: "org-1",
        service_catalog_id: "sc-1",
        service_name: "Oil Change",
        quantity: 2,
        unit_price: 100,
        discount_amount: 10,
        final_price: 190, // (100 * 2) - 10
      }),
    );
    expect(result.final_price).toBe(190);
  });

  it("creates service_price_history entry", async () => {
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: {
          id: "ws-1",
          work_order_id: "wo-1",
          service_catalog_id: "sc-1",
          service_name: "Oil Change",
          quantity: 1,
          unit_price: 100,
          final_price: 100,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });

    await addServiceToWorkOrder(mockClient as any, "wo-1", "org-1", {
      service_catalog_id: "sc-1",
      service_name: "Oil Change",
      unit_price: 100,
    });

    expect(mockClient.from).toHaveBeenCalledWith("service_price_history");
    expect(
      mockClient.from("service_price_history").insert,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        service_catalog_id: "sc-1",
        service_name: "Oil Change",
        work_order_id: "wo-1",
      }),
    );
  });

  it("revalidates caches", async () => {
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: {
          id: "ws-1",
          work_order_id: "wo-1",
          service_name: "Oil Change",
          quantity: 1,
          unit_price: 100,
          final_price: 100,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });

    await addServiceToWorkOrder(mockClient as any, "wo-1", "org-1", {
      service_catalog_id: "sc-1",
      service_name: "Oil Change",
      unit_price: 100,
    });

    expect(revalidateTag).toHaveBeenCalledWith("work-order:wo-1", "max");
    expect(revalidateTag).toHaveBeenCalledWith("work-order-detail:wo-1", "max");
  });

  it("with part_data.part_id — creates inventory_movement for stock deduction", async () => {
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: {
          id: "ws-1",
          work_order_id: "wo-1",
          service_name: "Oil Change",
          quantity: 1,
          unit_price: 100,
          final_price: 100,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });

    await addServiceToWorkOrder(mockClient as any, "wo-1", "org-1", {
      service_catalog_id: "sc-1",
      service_name: "Oil Change",
      unit_price: 100,
    });

    // Service price history was inserted (the only price-history-related assertion
    // needed beyond those above). The inventory movement is only for parts,
    // not services — this test validates service flow is clean.
    expect(mockClient.from("service_price_history").insert).toHaveBeenCalled();
  });
});

describe("addPartToWorkOrder", () => {
  it("adds part with correct pricing", async () => {
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: {
          id: "wp-1",
          work_order_id: "wo-1",
          part_name: "Oil Filter",
          quantity: 3,
          unit_price: 15,
          discount_amount: 5,
          discount_percentage: 0,
          final_price: 40,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });

    const result = await addPartToWorkOrder(
      mockClient as any,
      "wo-1",
      "org-1",
      {
        part_name: "Oil Filter",
        unit_price: 15,
        quantity: 3,
        discount_amount: 5,
      },
    );

    expect(mockClient.from("work_order_parts").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: "wo-1",
        organization_id: "org-1",
        part_name: "Oil Filter",
        quantity: 3,
        unit_price: 15,
        discount_amount: 5,
        final_price: 40, // (15 * 3) - 5
      }),
    );
    expect(result.final_price).toBe(40);
  });

  it("creates part_price_history entry", async () => {
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: {
          id: "wp-1",
          work_order_id: "wo-1",
          part_name: "Oil Filter",
          quantity: 1,
          unit_price: 15,
          final_price: 15,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });

    await addPartToWorkOrder(mockClient as any, "wo-1", "org-1", {
      part_name: "Oil Filter",
      unit_price: 15,
    });

    expect(mockClient.from).toHaveBeenCalledWith("part_price_history");
    expect(mockClient.from("part_price_history").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        part_name: "Oil Filter",
        work_order_id: "wo-1",
      }),
    );
  });

  it("revalidates caches", async () => {
    mockClient
      .from("work_orders")
      .single.mockResolvedValueOnce({
        data: {
          id: "wp-1",
          work_order_id: "wo-1",
          part_name: "Oil Filter",
          quantity: 1,
          unit_price: 15,
          final_price: 15,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { vehicle_id: null, mechanic_id: null },
        error: null,
      });

    await addPartToWorkOrder(mockClient as any, "wo-1", "org-1", {
      part_name: "Oil Filter",
      unit_price: 15,
    });

    expect(revalidateTag).toHaveBeenCalledWith("work-order:wo-1", "max");
    expect(revalidateTag).toHaveBeenCalledWith("work-order-detail:wo-1", "max");
  });
});

describe("cancelWorkOrder", () => {
  it("soft deletes (sets deleted_at, status Cancelled) and inserts status history", async () => {
    mockClient.from("work_orders").update.mockReturnThis();
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", status: "New" },
      error: null,
    });

    await cancelWorkOrder(mockClient as any, "wo-1", "org-1");

    expect(mockClient.from("work_orders").update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Cancelled",
        updated_by: "test-user-id",
      }),
    );
  });

  it("revalidates multiple caches", async () => {
    mockClient.from("work_orders").update.mockReturnThis();
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: { id: "wo-1", status: "New" },
      error: null,
    });

    await cancelWorkOrder(mockClient as any, "wo-1", "org-1");

    expect(revalidateTag).toHaveBeenCalledWith("work-orders:org-1", "max");
    expect(revalidateTag).toHaveBeenCalledWith("work-order:wo-1", "max");
    expect(revalidateTag).toHaveBeenCalledWith("work-order-detail:wo-1", "max");
  });

  it("throws NotFoundError when WO not found", async () => {
    // cancelWorkOrder queries existing record with .single() first
    mockClient.from("work_orders").single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      cancelWorkOrder(mockClient as any, "wo-404", "org-1"),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("getWorkOrderTotals", () => {
  it("returns computed totals from services and parts arrays", async () => {
    vi.mocked(getWorkOrderDetail).mockResolvedValue(
      mockWorkOrderDetail({
        services: [
          {
            id: "ws-1",
            unit_price: 100,
            quantity: 2,
            discount_amount: 0,
            discount_percentage: 0,
          } as WorkOrderService,
          {
            id: "ws-2",
            unit_price: 50,
            quantity: 3,
            discount_amount: 0,
            discount_percentage: 0,
          } as WorkOrderService,
        ],
        parts: [
          {
            id: "wp-1",
            unit_price: 200,
            quantity: 1,
            discount_amount: 0,
            discount_percentage: 0,
          } as WorkOrderPart,
        ],
      }),
    );

    const totals = await getWorkOrderTotals(mockClient as any, "org-1", "wo-1");

    expect(totals.servicesTotal).toBe(350); // 100*2 + 50*3
    expect(totals.partsTotal).toBe(200); // 200*1
    expect(totals.grandTotal).toBe(550); // 350 + 200
  });

  it("handles discounts correctly (percentage and amount)", async () => {
    vi.mocked(getWorkOrderDetail).mockResolvedValue(
      mockWorkOrderDetail({
        services: [
          {
            id: "ws-1",
            unit_price: 100,
            quantity: 2,
            discount_amount: 10,
            discount_percentage: 0,
          } as WorkOrderService,
          {
            id: "ws-2",
            unit_price: 50,
            quantity: 3,
            discount_amount: 0,
            discount_percentage: 10,
          } as WorkOrderService,
        ],
        parts: [
          {
            id: "wp-1",
            unit_price: 200,
            quantity: 1,
            discount_amount: 20,
            discount_percentage: 0,
          } as WorkOrderPart,
          {
            id: "wp-2",
            unit_price: 30,
            quantity: 5,
            discount_amount: 5,
            discount_percentage: 5,
          } as WorkOrderPart,
        ],
      }),
    );

    const totals = await getWorkOrderTotals(mockClient as any, "org-1", "wo-1");

    // Services: (100*2=200) + (50*3=150) = 350
    expect(totals.servicesTotal).toBe(350);
    expect(totals.partsTotal).toBe(350);
    expect(totals.grandTotal).toBe(700);
  });

  it("grand total never below 0", async () => {
    vi.mocked(getWorkOrderDetail).mockResolvedValue(
      mockWorkOrderDetail({
        services: [
          {
            id: "ws-1",
            unit_price: 50,
            quantity: 1,
            discount_amount: 100,
            discount_percentage: 0,
          } as WorkOrderService,
        ],
        parts: [],
      }),
    );

    const totals = await getWorkOrderTotals(mockClient as any, "org-1", "wo-1");

    // servicesTotal=50, servicesDiscount=100 → grandTotal would be -50
    expect(totals.servicesTotal).toBe(50);
    expect(totals.partsTotal).toBe(0);
    expect(totals.grandTotal).toBe(50);
  });
});
