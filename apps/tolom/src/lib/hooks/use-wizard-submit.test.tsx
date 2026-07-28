import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PartLine } from "./use-part-lines";
import type { ServiceLine } from "./use-service-lines";
import { useWizardSubmit } from "./use-wizard-submit";

// ── Mocks ──────────────────────────────────────────────────────

const { mockMutate, mockPush, mockToastError, mockToastSuccess } = vi.hoisted(
  () => ({
    mockMutate: vi.fn(),
    mockPush: vi.fn(),
    mockToastError: vi.fn(),
    mockToastSuccess: vi.fn(),
  }),
);

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useCreateWorkOrder: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

vi.mock("sonner", () => ({
  toast: { error: mockToastError, success: mockToastSuccess },
}));

// ── Fixtures ───────────────────────────────────────────────────

const orgId = "org-1";

const serviceLines: ServiceLine[] = [
  {
    service_catalog_id: "svc-1",
    name: "Oil Change",
    base_price: 50000,
    quantity: 1,
    discount_amount_mnt: 0,
    discount_percent: 0,
    final_price: 50000,
  },
];

const partLines: PartLine[] = [
  {
    part_name: "Oil Filter",
    part_number: "OF-123",
    quantity: 1,
    unit_price: 15000,
    final_price: 15000,
  },
];

const baseOptions = {
  selectedCustomerId: "cust-1",
  selectedVehicleId: "veh-1",
  selectedMechanicId: "mech-1",
  description: "Regular maintenance",
  complaint: "Engine noise",
  diagnosisLabelId: "diag-1",
  serviceLines,
  partLines,
  onCreated: vi.fn(),
};

// ── Tests ──────────────────────────────────────────────────────

describe("useWizardSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns early with toast.error if no customerId", async () => {
    const { result } = renderHook(() =>
      useWizardSubmit(orgId, { ...baseOptions, selectedCustomerId: null }),
    );

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      "Customer and vehicle are required",
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("returns early with toast.error if no vehicleId", async () => {
    const { result } = renderHook(() =>
      useWizardSubmit(orgId, { ...baseOptions, selectedVehicleId: null }),
    );

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      "Customer and vehicle are required",
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("calls mutate with transformed data when all fields present", async () => {
    const { result } = renderHook(() => useWizardSubmit(orgId, baseOptions));

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      mechanic_id: "mech-1",
      notes: "Regular maintenance",
      complaint: "Engine noise",
      diagnosis_label_id: "diag-1",
      services: [
        {
          service_catalog_id: "svc-1",
          service_name: "Oil Change",
          quantity: 1,
          unit_price: 50000,
          discount_amount: 0,
          discount_percentage: 0,
        },
      ],
      parts: [
        {
          part_name: "Oil Filter",
          part_number: "OF-123",
          quantity: 1,
          unit_price: 15000,
        },
      ],
    });
  });

  it("shows success toast and navigates on mutation success", async () => {
    const { result } = renderHook(() => useWizardSubmit(orgId, baseOptions));

    await act(async () => {
      await result.current.handleCreate();
    });

    const onSuccess = mockMutate.mock.calls[0][1].onSuccess;

    act(() => {
      onSuccess({ id: "wo-42" });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Work order created");
    expect(mockPush).toHaveBeenCalledWith("/dashboard/work-orders/wo-42");
    expect(baseOptions.onCreated).toHaveBeenCalled();
  });

  it("shows error toast on mutation failure", async () => {
    const { result } = renderHook(() => useWizardSubmit(orgId, baseOptions));

    await act(async () => {
      await result.current.handleCreate();
    });

    const onError = mockMutate.mock.calls[0][1].onError;

    act(() => {
      onError(new Error("Server error"));
    });

    expect(mockToastError).toHaveBeenCalledWith("Server error");
  });
});
