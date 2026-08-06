import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkOrderDetail } from "@/lib/types";
import { useCatalogMutations } from "../_use-catalog-mutations";

const {
  createMutateMock,
  deleteMutateMock,
  updateMutateMock,
  toastFn,
  toastSuccess,
  toastError,
  toastDismiss,
  reportServerError,
} = vi.hoisted(() => ({
  createMutateMock: vi.fn(),
  deleteMutateMock: vi.fn(),
  updateMutateMock: vi.fn(),
  toastFn: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastDismiss: vi.fn(),
  reportServerError: vi.fn(),
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: (config: { method?: string }) => ({
    mutateAsync:
      config?.method === "POST"
        ? createMutateMock
        : config?.method === "DELETE"
          ? deleteMutateMock
          : updateMutateMock,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(toastFn, {
    success: toastSuccess,
    error: toastError,
    dismiss: toastDismiss,
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError,
}));

const API_ERROR = new Error("API down");

function requireTempId(id: string | null): string {
  if (!id) throw new Error("expected a temp id from the hook");
  return id;
}

function makeServiceItem(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    service_name: `service-${id}`,
    quantity: 1,
    unit_price: 1000,
    final_price: 1000,
    discount_amount: 0,
    discount_percentage: 0,
    service_catalog_id: null,
    ...overrides,
  };
}

function makePartItem(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    part_name: `part-${id}`,
    quantity: 1,
    unit_price: 1000,
    final_price: 1000,
    discount_amount: 0,
    discount_percentage: 0,
    part_id: null,
    ...overrides,
  };
}

function makeWorkOrder(
  services: Record<string, unknown>[] = [],
  parts: Record<string, unknown>[] = [],
): WorkOrderDetail {
  return {
    id: "wo-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    customer_id: null,
    vehicle_id: null,
    mechanic_id: null,
    status: "In Progress",
    complaint: null,
    diagnosis: null,
    description: null,
    notes: null,
    mechanic_notes: null,
    diagnosis_label_id: null,
    bay_number: 1,
    queue_order: 0,
    odometer_at_service: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    subtotal: 0,
    total: 0,
    completed_at: null,
    started_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    customer: null,
    vehicle: null,
    mechanic: null,
    helpers: [],
    services: services as WorkOrderDetail["services"],
    parts: parts as WorkOrderDetail["parts"],
    status_history: [],
    service_history: [],
  };
}

interface HarnessOptions {
  workOrderId?: string | null;
  orgId?: string | undefined;
  orgIdRefCurrent?: string | null;
}

function setup(
  entity: "service" | "part",
  wo: WorkOrderDetail | null,
  options: HarnessOptions = {},
) {
  let currentWo = wo;
  const setWo = vi.fn(
    (
      updater:
        | WorkOrderDetail
        | null
        | ((prev: WorkOrderDetail | null) => WorkOrderDetail | null),
    ) => {
      currentWo = typeof updater === "function" ? updater(currentWo) : updater;
    },
  );
  const onRefresh = vi.fn();
  const orgIdRef = {
    current:
      options.orgIdRefCurrent === undefined ? "org-1" : options.orgIdRefCurrent,
  };

  const hook = renderHook(
    ({ woValue }: { woValue: WorkOrderDetail | null }) =>
      useCatalogMutations({
        entity,
        workOrderId:
          options.workOrderId === undefined ? "wo-1" : options.workOrderId,
        orgIdRef,
        orgId: options.orgId ?? "org-1",
        branchId: "branch-1",
        wo: woValue,
        setWo,
        onRefresh,
      }),
    { initialProps: { woValue: wo } },
  );

  return {
    hook,
    getWo: () => currentWo,
    setWo,
    onRefresh,
    orgIdRef,
    rerender: () => hook.rerender({ woValue: currentWo }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCatalogMutations — service entity", () => {
  it("adds a service optimistically with computed price and clears search UI", () => {
    const { hook, getWo } = setup("service", makeWorkOrder());

    act(() => {
      hook.result.current.setServiceSearch("oil");
      hook.result.current.addService({
        id: "cat-1",
        name: "Oil Change",
        default_price: 50000,
        last_price: 60000,
      });
    });

    expect(hook.result.current.serviceSearch).toBe("");
    expect(hook.result.current.showAddService).toBe(false);
    expect(hook.result.current.lastAddedServiceId).toMatch(/^temp-/);
    expect(hook.result.current.addingServiceIds.size).toBe(1);

    const added = getWo()?.services[0];
    expect(added?.id).toMatch(/^temp-/);
    expect(added?.service_name).toBe("Oil Change");
    expect(added?.service_catalog_id).toBe("cat-1");
    expect(added?.quantity).toBe(1);
    expect(added?.unit_price).toBe(60000);
    expect(added?.final_price).toBe(60000);
    expect(added?.discount_amount).toBe(0);
    expect(added?.discount_percentage).toBe(0);
    expect(added?.work_order_id).toBe("wo-1");
    expect(added?.description).toBeNull();
    expect(added?.mechanic_id).toBeNull();
  });

  it("uses default_price when last_price is missing and nulls catalog id for global items", () => {
    const { hook, getWo } = setup("service", makeWorkOrder());

    act(() => {
      hook.result.current.addService({
        id: "global-svc",
        name: "Wash",
        default_price: 30000,
        last_price: null,
        _source: "global",
      });
    });

    const added = getWo()?.services[0];
    expect(added?.unit_price).toBe(30000);
    expect(added?.service_catalog_id).toBeNull();
  });

  it("is a no-op when workOrderId is null", () => {
    const { hook, getWo, setWo } = setup("service", makeWorkOrder(), {
      workOrderId: null,
    });

    act(() => {
      hook.result.current.addService({
        id: "cat-1",
        name: "Oil Change",
        default_price: 50000,
      });
    });

    expect(getWo()?.services).toHaveLength(0);
    expect(hook.result.current.lastAddedServiceId).toBeNull();
    expect(setWo).not.toHaveBeenCalled();
  });

  it("confirms a temp service via POST with the observable mutation payload", async () => {
    createMutateMock.mockResolvedValue({
      id: "svc-1",
      service_name: "Oil Change",
      quantity: 1,
      unit_price: 60000,
    });
    const { hook, getWo, onRefresh, rerender } = setup(
      "service",
      makeWorkOrder(),
    );

    act(() => {
      hook.result.current.addService({
        id: "cat-1",
        name: "Oil Change",
        default_price: 50000,
        last_price: 60000,
      });
    });
    rerender();

    await act(async () => {
      await hook.result.current.handleServicePriceSave(
        requireTempId(hook.result.current.lastAddedServiceId),
        60000,
      );
    });

    expect(createMutateMock).toHaveBeenCalledWith({
      service_name: "Oil Change",
      quantity: 1,
      unit_price: 60000,
      catalog_item_variant_id: null,
      variant_label: null,
      service_catalog_id: "cat-1",
    });
    expect(getWo()?.services[0].id).toBe("svc-1");
    expect(onRefresh).toHaveBeenCalled();
    expect(hook.result.current.addingServiceIds.size).toBe(0);
    expect(hook.result.current.confirmingServiceIds.size).toBe(0);
    expect(toastSuccess).toHaveBeenCalledWith("Added service: Oil Change");
  });

  it("rolls back the optimistic service when the create API call fails", async () => {
    createMutateMock.mockRejectedValue(API_ERROR);
    const { hook, getWo, rerender } = setup("service", makeWorkOrder());

    act(() => {
      hook.result.current.addService({
        id: "cat-1",
        name: "Oil Change",
        default_price: 50000,
      });
    });
    rerender();

    await act(async () => {
      await hook.result.current.handleServicePriceSave(
        requireTempId(hook.result.current.lastAddedServiceId),
        50000,
      );
    });

    expect(getWo()?.services).toHaveLength(0);
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      API_ERROR,
    );
    expect(toastError).toHaveBeenCalledWith("Failed to add service");
    expect(hook.result.current.addingServiceIds.size).toBe(0);
    expect(hook.result.current.confirmingServiceIds.size).toBe(0);
  });

  it("keeps the temp item untouched when confirmAdd has no org id", async () => {
    const { hook, getWo, rerender } = setup("service", makeWorkOrder(), {
      orgIdRefCurrent: null,
    });

    act(() => {
      hook.result.current.addService({
        id: "cat-1",
        name: "Oil Change",
        default_price: 50000,
      });
    });
    rerender();

    await act(async () => {
      await hook.result.current.handleServicePriceSave(
        requireTempId(hook.result.current.lastAddedServiceId),
        50000,
      );
    });

    expect(createMutateMock).not.toHaveBeenCalled();
    expect(getWo()?.services).toHaveLength(1);
  });

  it("removes a temp service without calling the API", () => {
    const { hook, getWo, rerender } = setup("service", makeWorkOrder());

    act(() => {
      hook.result.current.addService({
        id: "cat-1",
        name: "Oil Change",
        default_price: 50000,
      });
    });
    rerender();
    const tempId = requireTempId(hook.result.current.lastAddedServiceId);

    act(() => {
      void hook.result.current.removeService(tempId);
    });

    expect(getWo()?.services).toHaveLength(0);
    expect(deleteMutateMock).not.toHaveBeenCalled();
  });

  it("removes a persisted service via DELETE and restores it through the Undo action", async () => {
    deleteMutateMock.mockResolvedValue(undefined);
    createMutateMock.mockResolvedValue({
      id: "svc-1",
      service_name: "Oil Change",
      quantity: 2,
      unit_price: 100,
    });
    const { hook, getWo, onRefresh } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 2,
          unit_price: 100,
          final_price: 200,
          service_catalog_id: "cat-1",
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.removeService("svc-1");
    });

    expect(deleteMutateMock).toHaveBeenCalledWith({ serviceId: "svc-1" });
    expect(getWo()?.services).toHaveLength(0);
    expect(toastFn).toHaveBeenCalledWith(
      "Service removed",
      expect.objectContaining({
        action: expect.objectContaining({ label: "Undo" }),
        duration: 5000,
      }),
    );
    expect(onRefresh).toHaveBeenCalled();

    const undoAction = toastFn.mock.calls[0][1].action;
    await act(async () => {
      await undoAction.onClick();
    });

    expect(createMutateMock).toHaveBeenCalledWith({
      service_name: "service-svc-1",
      quantity: 2,
      unit_price: 100,
      catalog_item_variant_id: null,
      variant_label: null,
      service_catalog_id: "cat-1",
    });
    expect(getWo()?.services).toHaveLength(1);
    expect(getWo()?.services[0].id).toBe("svc-1");
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it("rolls the service back into the list when DELETE fails", async () => {
    deleteMutateMock.mockRejectedValue(API_ERROR);
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([makeServiceItem("svc-1")]),
    );

    await act(async () => {
      await hook.result.current.removeService("svc-1");
    });

    expect(getWo()?.services).toHaveLength(1);
    expect(getWo()?.services[0].id).toBe("svc-1");
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      API_ERROR,
    );
    expect(toastError).toHaveBeenCalledWith("Failed to remove service");
  });

  it("does nothing when removing an unknown id", async () => {
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([makeServiceItem("svc-1")]),
    );

    await act(async () => {
      await hook.result.current.removeService("missing");
    });

    expect(getWo()?.services).toHaveLength(1);
    expect(deleteMutateMock).not.toHaveBeenCalled();
  });

  it("updates price with final-price calculation and PATCHes unit_price", async () => {
    updateMutateMock.mockResolvedValue(undefined);
    const { hook, getWo, onRefresh } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 2,
          unit_price: 10000,
          final_price: 20000,
          discount_amount: 1000,
          discount_percentage: 10,
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.handleServicePriceSave("svc-1", 15000);
    });

    // 15000 * 2 = 30000; minus 10% (3000) minus 1000 amount = 26000
    expect(getWo()?.services[0]).toMatchObject({
      unit_price: 15000,
      final_price: 26000,
    });
    expect(updateMutateMock).toHaveBeenCalledWith({
      id: "svc-1",
      body: { unit_price: 15000 },
    });
    expect(toastSuccess).toHaveBeenCalledWith("Price updated");
    expect(onRefresh).toHaveBeenCalled();
  });

  it("rolls back price and final price when the PATCH fails", async () => {
    updateMutateMock.mockRejectedValue(API_ERROR);
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 2,
          unit_price: 10000,
          final_price: 20000,
          discount_amount: 1000,
          discount_percentage: 10,
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.handleServicePriceSave("svc-1", 15000);
    });

    expect(getWo()?.services[0]).toMatchObject({
      unit_price: 10000,
      final_price: 20000,
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      API_ERROR,
    );
    expect(toastError).toHaveBeenCalledWith("Failed to update price");
  });

  it("rejects negative and NaN prices without mutating state", async () => {
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([makeServiceItem("svc-1")]),
    );

    await act(async () => {
      await hook.result.current.handleServicePriceSave("svc-1", -5);
    });
    expect(toastError).toHaveBeenCalledWith("Invalid price");

    await act(async () => {
      await hook.result.current.handleServicePriceSave("svc-1", Number.NaN);
    });
    expect(updateMutateMock).not.toHaveBeenCalled();
    expect(getWo()?.services[0].unit_price).toBe(1000);
  });

  it("treats non-numeric discount values as zero when calculating final price", async () => {
    updateMutateMock.mockResolvedValue(undefined);
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 1,
          unit_price: 1000,
          final_price: 1000,
          discount_amount: "not-a-number",
          discount_percentage: Number.NaN,
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.handleServicePriceSave("svc-1", 1000);
    });

    expect(getWo()?.services[0].final_price).toBe(1000);
  });

  it("floors final price at zero when discounts exceed the subtotal", async () => {
    updateMutateMock.mockResolvedValue(undefined);
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 1,
          unit_price: 100,
          final_price: 100,
          discount_amount: 5000,
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.handleServicePriceSave("svc-1", 100);
    });

    expect(getWo()?.services[0].final_price).toBe(0);
  });

  it("updates quantity with final-price recalculation and PATCHes quantity", async () => {
    updateMutateMock.mockResolvedValue(undefined);
    const { hook, getWo, onRefresh } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 2,
          unit_price: 10000,
          final_price: 20000,
          discount_amount: 1000,
          discount_percentage: 10,
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.handleServiceQtySave("svc-1", 4);
    });

    // 10000 * 4 = 40000; minus 10% (4000) minus 1000 = 35000
    expect(getWo()?.services[0]).toMatchObject({
      quantity: 4,
      final_price: 35000,
    });
    expect(updateMutateMock).toHaveBeenCalledWith({
      id: "svc-1",
      body: { quantity: 4 },
    });
    expect(toastSuccess).toHaveBeenCalledWith("Quantity updated");
    expect(onRefresh).toHaveBeenCalled();
  });

  it("rolls back quantity and final price when quantity PATCH fails", async () => {
    updateMutateMock.mockRejectedValue(API_ERROR);
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 2,
          unit_price: 10000,
          final_price: 20000,
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.handleServiceQtySave("svc-1", 4);
    });

    expect(getWo()?.services[0]).toMatchObject({
      quantity: 2,
      final_price: 20000,
    });
    expect(toastError).toHaveBeenCalledWith("Failed to update quantity");
  });

  it("rejects quantities below 1", async () => {
    const { hook } = setup(
      "service",
      makeWorkOrder([makeServiceItem("svc-1")]),
    );

    await act(async () => {
      await hook.result.current.handleServiceQtySave("svc-1", 0);
    });

    expect(toastError).toHaveBeenCalledWith("Quantity must be at least 1");
    expect(updateMutateMock).not.toHaveBeenCalled();
  });

  it("confirms a temp service with a quantity override", async () => {
    createMutateMock.mockResolvedValue({ id: "svc-1" });
    const { hook, getWo, rerender } = setup("service", makeWorkOrder());

    act(() => {
      hook.result.current.addService({
        id: "cat-1",
        name: "Oil Change",
        default_price: 50000,
      });
    });
    rerender();

    await act(async () => {
      await hook.result.current.handleServiceQtySave(
        requireTempId(hook.result.current.lastAddedServiceId),
        4,
      );
    });

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 4, unit_price: 50000 }),
    );
    expect(getWo()?.services[0].id).toBe("svc-1");
  });

  it("updates discount amount and percentage with recalculated final price", async () => {
    updateMutateMock.mockResolvedValue(undefined);
    const { hook, getWo, onRefresh } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 2,
          unit_price: 10000,
          final_price: 20000,
          discount_amount: 1000,
          discount_percentage: 10,
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.handleServiceDiscountSave("svc-1", 2000, 20);
    });

    // 10000 * 2 = 20000; minus 20% (4000) minus 2000 = 14000
    expect(getWo()?.services[0]).toMatchObject({
      discount_amount: 2000,
      discount_percentage: 20,
      final_price: 14000,
    });
    expect(updateMutateMock).toHaveBeenCalledWith({
      id: "svc-1",
      body: { discount_amount: 2000, discount_percentage: 20 },
    });
    expect(toastSuccess).toHaveBeenCalledWith("Discount updated");
    expect(onRefresh).toHaveBeenCalled();
  });

  it("rolls back discount fields when the discount PATCH fails", async () => {
    updateMutateMock.mockRejectedValue(API_ERROR);
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([
        makeServiceItem("svc-1", {
          quantity: 2,
          unit_price: 10000,
          final_price: 20000,
          discount_amount: 1000,
          discount_percentage: 10,
        }),
      ]),
    );

    await act(async () => {
      await hook.result.current.handleServiceDiscountSave("svc-1", 2000, 20);
    });

    expect(getWo()?.services[0]).toMatchObject({
      discount_amount: 1000,
      discount_percentage: 10,
      // Rollback restores the exact original price: 10000 * 2 minus 10% (2000) minus 1000 = 17000
      final_price: 17000,
    });
    expect(toastError).toHaveBeenCalledWith("Failed to update discount");
  });

  it("is a no-op for discount save when org id is missing", async () => {
    const { hook, getWo } = setup(
      "service",
      makeWorkOrder([makeServiceItem("svc-1")]),
      {
        orgIdRefCurrent: null,
      },
    );

    await act(async () => {
      await hook.result.current.handleServiceDiscountSave("svc-1", 100, 5);
    });

    expect(updateMutateMock).not.toHaveBeenCalled();
    expect(getWo()?.services[0].discount_amount).toBe(0);
  });
});

describe("useCatalogMutations — part entity", () => {
  it("adds a part optimistically with part-specific fields", () => {
    const { hook, getWo } = setup("part", makeWorkOrder());

    act(() => {
      hook.result.current.addPart({
        id: "p-1",
        name: "Brake Pad",
        default_price: 20000,
        last_price: 25000,
        _source: "org",
      });
    });

    expect(hook.result.current.lastAddedPartId).toMatch(/^temp-/);
    const added = getWo()?.parts[0];
    expect(added?.id).toMatch(/^temp-/);
    expect(added?.part_name).toBe("Brake Pad");
    expect(added?.part_id).toBe("p-1");
    expect(added?.unit_price).toBe(25000);
    expect(added?.final_price).toBe(25000);
    expect(added?.part_number).toBeNull();
    expect("description" in (added as Record<string, unknown>)).toBe(false);
  });

  it("confirms a temp part via POST with the observable mutation payload", async () => {
    createMutateMock.mockResolvedValue({ id: "p-1", part_name: "Brake Pad" });
    const { hook, getWo, onRefresh, rerender } = setup("part", makeWorkOrder());

    act(() => {
      hook.result.current.addPart({
        id: "p-1",
        name: "Brake Pad",
        default_price: 20000,
        last_price: 25000,
      });
    });
    rerender();

    await act(async () => {
      await hook.result.current.handlePartPriceSave(
        requireTempId(hook.result.current.lastAddedPartId),
        25000,
      );
    });

    expect(createMutateMock).toHaveBeenCalledWith({
      part_name: "Brake Pad",
      quantity: 1,
      unit_price: 25000,
      catalog_item_variant_id: null,
      variant_label: null,
      part_id: "p-1",
    });
    expect(getWo()?.parts[0].id).toBe("p-1");
    expect(onRefresh).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith("Added part: Brake Pad");
  });

  it("rolls back the optimistic part when the create API call fails", async () => {
    createMutateMock.mockRejectedValue(API_ERROR);
    const { hook, getWo, rerender } = setup("part", makeWorkOrder());

    act(() => {
      hook.result.current.addPart({
        id: "p-1",
        name: "Brake Pad",
        default_price: 20000,
      });
    });
    rerender();

    await act(async () => {
      await hook.result.current.handlePartPriceSave(
        requireTempId(hook.result.current.lastAddedPartId),
        20000,
      );
    });

    expect(getWo()?.parts).toHaveLength(0);
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      API_ERROR,
    );
    expect(toastError).toHaveBeenCalledWith("Failed to add part");
  });

  it("updates part price with final-price calculation and PATCHes unit_price", async () => {
    updateMutateMock.mockResolvedValue(undefined);
    const { hook, getWo, onRefresh } = setup(
      "part",
      makeWorkOrder(
        [],
        [
          makePartItem("p-1", {
            quantity: 3,
            unit_price: 10000,
            final_price: 30000,
          }),
        ],
      ),
    );

    await act(async () => {
      await hook.result.current.handlePartPriceSave("p-1", 12000);
    });

    expect(getWo()?.parts[0]).toMatchObject({
      unit_price: 12000,
      final_price: 36000,
    });
    expect(updateMutateMock).toHaveBeenCalledWith({
      id: "p-1",
      body: { unit_price: 12000 },
    });
    expect(toastSuccess).toHaveBeenCalledWith("Price updated");
    expect(onRefresh).toHaveBeenCalled();
  });

  it("updates part discount with recalculated final price", async () => {
    updateMutateMock.mockResolvedValue(undefined);
    const { hook, getWo } = setup(
      "part",
      makeWorkOrder(
        [],
        [
          makePartItem("p-1", {
            quantity: 3,
            unit_price: 12000,
            final_price: 36000,
          }),
        ],
      ),
    );

    await act(async () => {
      await hook.result.current.handlePartDiscountSave("p-1", 500, 10);
    });

    // 12000 * 3 = 36000; minus 10% (3600) minus 500 = 31900
    expect(getWo()?.parts[0]).toMatchObject({
      discount_amount: 500,
      discount_percentage: 10,
      final_price: 31900,
    });
    expect(updateMutateMock).toHaveBeenCalledWith({
      id: "p-1",
      body: { discount_amount: 500, discount_percentage: 10 },
    });
  });

  it("removes a persisted part via DELETE", async () => {
    deleteMutateMock.mockResolvedValue(undefined);
    const { hook, getWo } = setup(
      "part",
      makeWorkOrder([], [makePartItem("p-1")]),
    );

    await act(async () => {
      await hook.result.current.removePart("p-1");
    });

    expect(deleteMutateMock).toHaveBeenCalledWith({ partId: "p-1" });
    expect(getWo()?.parts).toHaveLength(0);
    expect(toastFn).toHaveBeenCalledWith(
      "Part removed",
      expect.objectContaining({
        action: expect.objectContaining({ label: "Undo" }),
      }),
    );
  });

  it("rolls the part back when DELETE fails", async () => {
    deleteMutateMock.mockRejectedValue(API_ERROR);
    const { hook, getWo } = setup(
      "part",
      makeWorkOrder([], [makePartItem("p-1")]),
    );

    await act(async () => {
      await hook.result.current.removePart("p-1");
    });

    expect(getWo()?.parts).toHaveLength(1);
    expect(getWo()?.parts[0].id).toBe("p-1");
    expect(toastError).toHaveBeenCalledWith("Failed to remove part");
  });
});
