import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { workOrderKeys } from "@/lib/queries/keys";
import {
  type PaymentFormValues,
  useWorkOrderDetailPage,
} from "../_use-work-order-detail-page";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useCurrentOrg: vi.fn(),
  useWorkOrderDetail: vi.fn(),
  useServiceCatalog: vi.fn(),
  usePartsCatalog: vi.fn(),
  useMechanicsList: vi.fn(),
  usePartPriceHistory: vi.fn(),
  useInvoicePayments: vi.fn(),
  useRefundList: vi.fn(),
  useStoreCreditBalance: vi.fn(),
  useAttachments: vi.fn(),
  useLastVisitData: vi.fn(),
  fetchServicePriceHistory: vi.fn(),
  updateStatusMutate: vi.fn(),
  assignMechanicMutate: vi.fn(),
  addServiceMutate: vi.fn(),
  removeServiceMutate: vi.fn(),
  addPartMutate: vi.fn(),
  removePartMutate: vi.fn(),
  createInvoiceMutate: vi.fn(),
  recordPaymentMutate: vi.fn(),
  deleteAttachmentMutate: vi.fn(),
  addServiceMutateAsync: vi.fn().mockResolvedValue({}),
  addPartMutateAsync: vi.fn().mockResolvedValue({}),
  push: vi.fn(),
  back: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  reportServerError: vi.fn(),
  useUpdateWorkOrderStatus: vi.fn(),
  useAssignMechanic: vi.fn(),
  useAddService: vi.fn(),
  useRemoveService: vi.fn(),
  useAddPart: vi.fn(),
  useRemovePart: vi.fn(),
  useCreateInvoice: vi.fn(),
  useRecordPayment: vi.fn(),
  useDeleteAttachment: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "wo-1" }),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: mocks.push, back: mocks.back }),
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  usePartsCatalog: mocks.usePartsCatalog,
}));

vi.mock("@/lib/queries/use-price-memory", () => ({
  useLastVisitData: mocks.useLastVisitData,
}));

vi.mock("@/lib/queries/use-refunds", () => ({
  useRefundList: mocks.useRefundList,
  useStoreCreditBalance: mocks.useStoreCreditBalance,
}));

vi.mock("@/lib/queries/use-work-order-attachments", () => ({
  useAttachments: mocks.useAttachments,
  useDeleteAttachment: mocks.useDeleteAttachment,
}));

vi.mock("@/lib/queries/use-work-order-detail", () => ({
  fetchServicePriceHistory: mocks.fetchServicePriceHistory,
  useWorkOrderDetail: mocks.useWorkOrderDetail,
  useServiceCatalog: mocks.useServiceCatalog,
  useMechanicsList: mocks.useMechanicsList,
  usePartPriceHistory: mocks.usePartPriceHistory,
  useInvoicePayments: mocks.useInvoicePayments,
  useUpdateWorkOrderStatus: mocks.useUpdateWorkOrderStatus,
  useAssignMechanic: mocks.useAssignMechanic,
  useAddService: mocks.useAddService,
  useRemoveService: mocks.useRemoveService,
  useAddPart: mocks.useAddPart,
  useRemovePart: mocks.useRemovePart,
  useCreateInvoice: mocks.useCreateInvoice,
  useRecordPayment: mocks.useRecordPayment,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ── Fixtures ────────────────────────────────────────────────────────

const baseWo = {
  id: "wo-12345678",
  organization_id: "org-1",
  branch_id: null,
  customer_id: "cust-1",
  vehicle_id: "veh-1",
  mechanic_id: null,
  status: "In Progress",
  complaint: null,
  diagnosis: null,
  description: null,
  notes: null,
  mechanic_notes: null,
  diagnosis_label_id: null,
  bay_number: null,
  queue_order: 0,
  odometer_at_service: null,
  discount_amount: 0,
  discount_percentage: 0,
  discount_total: 0,
  subtotal: 18000,
  total: 18000,
  completed_at: null,
  started_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  created_by: null,
  updated_by: null,
  deleted_at: null,
  customer: { id: "cust-1", first_name: "Bold", last_name: "Bat" },
  vehicle: {
    id: "veh-1",
    make: "Toyota",
    model: "Prius",
    plate_number: "1234УБА",
  },
  mechanic: null,
  helpers: [],
  status_history: [],
  service_history: [],
  services: [
    {
      id: "svc-1",
      service_catalog_id: "sc-1",
      service_name: "Oil Change",
      quantity: 1,
      unit_price: 10000,
      final_price: 12000,
      discount_amount: 0,
      discount_percentage: 0,
      unit_cost: 5000,
      last_sold_price: null,
      notes: null,
      description: null,
      mechanic_id: null,
      work_order_id: "wo-12345678",
      organization_id: "org-1",
      created_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  parts: [
    {
      id: "part-1",
      part_name: "Oil Filter",
      quantity: 2,
      unit_price: 3000,
      final_price: 6000,
      discount_amount: 0,
      discount_percentage: 0,
      unit_cost: 1000,
      last_sold_price: null,
      notes: null,
      part_number: null,
      part_id: null,
      work_order_id: "wo-12345678",
      organization_id: "org-1",
      created_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
};

function setOrgState(
  data: { orgId: string; orgName: string | null } | null = {
    orgId: "org-1",
    orgName: "Org 1",
  },
  opts: { isPending?: boolean; error?: Error | null } = {},
) {
  mocks.useCurrentOrg.mockReturnValue({
    data,
    isPending: opts.isPending ?? false,
    error: opts.error ?? null,
  });
}

function setWoState(
  data: unknown = baseWo,
  opts: { isPending?: boolean; error?: Error | null } = {},
) {
  mocks.useWorkOrderDetail.mockReturnValue({
    data,
    isPending: opts.isPending ?? false,
    error: opts.error ?? null,
    refetch: vi.fn(),
  });
}

function setDefaultQueries() {
  mocks.useServiceCatalog.mockReturnValue({ data: [] });
  mocks.usePartsCatalog.mockReturnValue({ data: [] });
  mocks.useMechanicsList.mockReturnValue({ data: [] });
  mocks.usePartPriceHistory.mockReturnValue({ data: undefined });
  mocks.useInvoicePayments.mockReturnValue({ data: undefined });
  mocks.useRefundList.mockReturnValue({ data: [] });
  mocks.useStoreCreditBalance.mockReturnValue({ data: 0 });
  mocks.useAttachments.mockReturnValue({ data: [] });
  mocks.useLastVisitData.mockReturnValue({ data: undefined });
}

// ── Tests ───────────────────────────────────────────────────────────

describe("useWorkOrderDetailPage", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    setOrgState();
    setWoState();
    setDefaultQueries();
    mocks.useUpdateWorkOrderStatus.mockReturnValue({
      mutate: mocks.updateStatusMutate,
      isPending: false,
    });
    mocks.useAssignMechanic.mockReturnValue({
      mutate: mocks.assignMechanicMutate,
      isPending: false,
    });
    mocks.useAddService.mockReturnValue({
      mutate: mocks.addServiceMutate,
      mutateAsync: mocks.addServiceMutateAsync,
      isPending: false,
    });
    mocks.useRemoveService.mockReturnValue({
      mutate: mocks.removeServiceMutate,
      isPending: false,
    });
    mocks.useAddPart.mockReturnValue({
      mutate: mocks.addPartMutate,
      mutateAsync: mocks.addPartMutateAsync,
      isPending: false,
    });
    mocks.useRemovePart.mockReturnValue({
      mutate: mocks.removePartMutate,
      isPending: false,
    });
    mocks.useCreateInvoice.mockReturnValue({
      mutate: mocks.createInvoiceMutate,
      isPending: false,
    });
    mocks.useRecordPayment.mockReturnValue({
      mutate: mocks.recordPaymentMutate,
      isPending: false,
    });
    mocks.useDeleteAttachment.mockReturnValue({
      mutate: mocks.deleteAttachmentMutate,
      isPending: false,
    });
    mocks.fetchServicePriceHistory.mockResolvedValue([9000]);
  });

  // ── Loading / error states ──

  it("reports loading while the org or work order is pending", () => {
    setOrgState(null, { isPending: true });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("reports loading while the work order is pending", () => {
    setWoState(undefined, { isPending: true });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
  });

  it("surfaces the org error message", () => {
    setOrgState(null, { error: new Error("org boom") });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    expect(result.current.error).toBe("org boom");
  });

  it("surfaces the work order error message", () => {
    setWoState(undefined, { error: new Error("wo boom") });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    expect(result.current.error).toBe("wo boom");
  });

  it("shows noOrganization and redirects when the org is missing", async () => {
    setOrgState(null);
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => {});
    expect(result.current.error).toBe("noOrganization");
    expect(mocks.push).toHaveBeenCalledWith(
      "/auth/select-organization?returnUrl=/dashboard/work-orders",
    );
  });

  it("does not redirect when the org is loaded", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => {});
    expect(result.current.error).toBeNull();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  // ── Param handling & data transforms ──

  it("passes the route id and orgId into the work order query", () => {
    renderHook(() => useWorkOrderDetailPage(), { wrapper: createWrapper() });
    expect(mocks.useWorkOrderDetail).toHaveBeenCalledWith("org-1", "wo-1");
    expect(mocks.useWorkOrderDetail).toHaveBeenCalledTimes(1);
  });

  it("derives totals, costs, profit and margin from services and parts", () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    expect(result.current.woId).toBe("wo-1");
    expect(result.current.orgId).toBe("org-1");
    expect(result.current.orgName).toBe("Org 1");
    // services: final_price 12000; parts: final_price 6000
    expect(result.current.servicesTotal).toBe(12000);
    expect(result.current.partsTotal).toBe(6000);
    // costs: service unit_cost 5000 * 1 + part unit_cost 1000 * 2
    expect(result.current.servicesCost).toBe(5000);
    expect(result.current.partsCost).toBe(2000);
    expect(result.current.totalCost).toBe(7000);
    expect(result.current.grossProfit).toBe(11000);
    expect(result.current.marginPercent).toBeCloseTo(61.11, 1);
    // balance falls back to the line-item total without invoice data
    expect(result.current.balanceDue).toBe(18000);
    expect(result.current.totalPaid).toBe(0);
    expect(result.current.invoiceStatus).toBe("");
  });

  it("uses invoice payments when present and filters completed refunds", () => {
    mocks.useInvoicePayments.mockReturnValue({
      data: {
        payments: [{ id: "p-1", amount: 10000 }],
        total_paid: 10000,
        balance_due: 8000,
        status: "partial",
      },
    });
    mocks.useRefundList.mockReturnValue({
      data: [
        { id: "r-1", invoice_id: "inv-1", status: "completed", amount: 2000 },
        { id: "r-2", invoice_id: "inv-1", status: "pending", amount: 500 },
        { id: "r-3", invoice_id: "other", status: "completed", amount: 999 },
      ],
    });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    act(() => result.current.setExistingInvoiceId("inv-1"));
    expect(result.current.payments).toHaveLength(1);
    expect(result.current.totalPaid).toBe(10000);
    expect(result.current.balanceDue).toBe(8000);
    expect(result.current.invoiceStatus).toBe("partial");
    expect(result.current.invoiceRefunds).toHaveLength(1);
    expect(result.current.totalRefunded).toBe(2000);
    expect(result.current.maxRefundable).toBe(8000);
  });

  it("exposes catalogs, mechanics, attachments and store credit", () => {
    mocks.useServiceCatalog.mockReturnValue({
      data: [{ id: "sc-1", name: "Oil Change" }],
    });
    mocks.usePartsCatalog.mockReturnValue({
      data: [{ id: "pt-1", part_name: "Filter" }],
    });
    mocks.useMechanicsList.mockReturnValue({
      data: [{ id: "m-1", full_name: "Bat" }],
    });
    mocks.useStoreCreditBalance.mockReturnValue({ data: 5000 });
    mocks.useAttachments.mockReturnValue({
      data: [{ id: "a-1", file_name: "photo.jpg" }],
    });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    expect(result.current.catalog).toHaveLength(1);
    expect(result.current.partsCatalog).toHaveLength(1);
    expect(result.current.mechanics).toHaveLength(1);
    expect(result.current.storeCreditBalance).toBe(5000);
    expect(result.current.attachments).toHaveLength(1);
  });

  // ── Status change wiring ──

  it("requires confirmation before completing/cancelling a work order", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    act(() => result.current.handleChangeStatus("Completed"));
    expect(result.current.confirmStatus).toBe("Completed");
    expect(mocks.updateStatusMutate).not.toHaveBeenCalled();

    await act(async () =>
      result.current.handleChangeStatus("Completed", "No parts in stock"),
    );
    expect(mocks.updateStatusMutate).toHaveBeenCalledWith({
      woId: "wo-1",
      status: "Completed",
      notes: undefined,
      loss_reason: "No parts in stock",
    });
    expect(result.current.confirmStatus).toBeNull();
  });

  it("applies non-terminal status changes immediately", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => result.current.handleChangeStatus("Diagnosing"));
    expect(result.current.confirmStatus).toBeNull();
    expect(mocks.updateStatusMutate).toHaveBeenCalledWith({
      woId: "wo-1",
      status: "Diagnosing",
      notes: undefined,
      loss_reason: undefined,
    });
  });

  it("includes notes from the confirmation notes field", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    act(() => result.current.handleChangeStatus("Cancelled"));
    act(() => result.current.setStatusNotes("Customer request"));
    await act(async () => result.current.handleChangeStatus("Cancelled"));
    expect(mocks.updateStatusMutate).toHaveBeenCalledWith({
      woId: "wo-1",
      status: "Cancelled",
      notes: "Customer request",
      loss_reason: undefined,
    });
  });

  it("wires mechanic assignment", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => result.current.handleAssignMechanic("m-7"));
    expect(mocks.assignMechanicMutate).toHaveBeenCalledWith({
      woId: "wo-1",
      mechanicId: "m-7",
    });
  });

  // ── Add service / part (optimistic + rollback) ──

  it("optimistically adds a service line and mutates with the fetched price", async () => {
    let capturedOptions: { onError?: () => void } | undefined;
    mocks.addServiceMutate.mockImplementation((_vars, opts) => {
      capturedOptions = opts;
    });
    mocks.fetchServicePriceHistory.mockResolvedValue([5000]);

    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    // Seed the detail cache so the optimistic update has a base to extend
    queryClient.setQueryData(workOrderKeys.detail("org-1", "wo-1"), baseWo);
    await act(async () =>
      result.current.handleAddService({ id: "sc-9", name: "Brake Pads" }),
    );

    const cached = queryClient.getQueryData(
      workOrderKeys.detail("org-1", "wo-1"),
    ) as { services: unknown[] };
    expect(cached.services).toHaveLength(2);
    const added = cached.services[1] as {
      id: string;
      service_name: string;
      unit_price: number;
    };
    expect(added.id).toMatch(/^temp-/);
    expect(added.service_name).toBe("Brake Pads");
    expect(added.unit_price).toBe(5000);

    expect(mocks.addServiceMutate).toHaveBeenCalledWith(
      {
        woId: "wo-1",
        body: {
          service_catalog_id: "sc-9",
          service_name: "Brake Pads",
          quantity: 1,
          unit_price: 5000,
        },
      },
      expect.any(Object),
    );

    // Rollback on error restores the previous cache
    await act(async () => capturedOptions?.onError?.());
    const after = queryClient.getQueryData(
      workOrderKeys.detail("org-1", "wo-1"),
    ) as { services: unknown[] };
    expect(after.services).toHaveLength(1);
  });

  it("falls back to the service default price when the price history fetch fails", async () => {
    mocks.fetchServicePriceHistory.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () =>
      result.current.handleAddService({
        id: "sc-9",
        name: "Brake Pads",
        default_price: 4200,
      }),
    );
    expect(mocks.reportServerError).toHaveBeenCalled();
    expect(mocks.addServiceMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ unit_price: 4200 }),
      }),
      expect.any(Object),
    );
  });

  it("adds a part with quantity and price and resets the form on success", async () => {
    let capturedOptions: { onSuccess?: () => void } | undefined;
    mocks.addPartMutate.mockImplementation((_vars, opts) => {
      capturedOptions = opts;
    });

    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    queryClient.setQueryData(workOrderKeys.detail("org-1", "wo-1"), baseWo);
    act(() =>
      result.current.setNewPart({
        part_name: "Air Filter",
        quantity: 2,
        unit_price: 4000,
      }),
    );
    await act(async () => result.current.handleAddPart());

    expect(mocks.addPartMutate).toHaveBeenCalledWith(
      {
        woId: "wo-1",
        body: {
          part_name: "Air Filter",
          quantity: 2,
          unit_price: 4000,
        },
      },
      expect.any(Object),
    );
    const cached = queryClient.getQueryData(
      workOrderKeys.detail("org-1", "wo-1"),
    ) as { parts: { final_price: number }[] };
    expect(cached.parts).toHaveLength(2);
    expect(cached.parts[1].final_price).toBe(8000);

    await act(async () => capturedOptions?.onSuccess?.());
    expect(result.current.newPart).toEqual({
      part_name: "",
      quantity: 1,
      unit_price: 0,
    });
    expect(result.current.showAddPart).toBe(false);
  });

  it("ignores add-part when the part name is blank", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => result.current.handleAddPart());
    expect(mocks.addPartMutate).not.toHaveBeenCalled();
  });

  it("pre-fills the part unit price from price history while it is still zero", async () => {
    mocks.usePartPriceHistory.mockReturnValue({ data: [777] });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.newPart.unit_price).toBe(777));
  });

  // ── Remove line ──

  it("removes a service line and calls the remove mutation", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    queryClient.setQueryData(workOrderKeys.detail("org-1", "wo-1"), baseWo);
    await act(async () => result.current.handleRemoveLine("service", "svc-1"));
    expect(mocks.removeServiceMutate).toHaveBeenCalledWith(
      { woId: "wo-1", serviceId: "svc-1" },
      expect.any(Object),
    );
    const cached = queryClient.getQueryData(
      workOrderKeys.detail("org-1", "wo-1"),
    ) as { services: unknown[] };
    expect(cached.services).toHaveLength(0);
  });

  // ── Invoice / payment wiring ──

  it("creates an invoice and navigates to the public invoice on success", async () => {
    let capturedOptions:
      | {
          onSuccess?: (data: { id: string; public_token: string }) => void;
        }
      | undefined;
    mocks.createInvoiceMutate.mockImplementation((_vars, opts) => {
      capturedOptions = opts;
    });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => result.current.handleGenerateInvoice());
    expect(mocks.createInvoiceMutate).toHaveBeenCalledWith(
      { woId: "wo-1" },
      expect.any(Object),
    );
    await act(async () =>
      capturedOptions?.onSuccess?.({ id: "inv-1", public_token: "tok-abc" }),
    );
    expect(result.current.existingInvoiceId).toBe("inv-1");
    expect(mocks.push).toHaveBeenCalledWith("/invoice/tok-abc");
  });

  it("rejects payments without an invoice", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    const values: PaymentFormValues = {
      amount: 100,
      method: "cash",
      reference: "",
      notes: "",
    };
    await act(async () => result.current.handlePaymentSubmit(values));
    expect(mocks.toast.error).toHaveBeenCalledWith("invalidPaymentAmount");
    expect(mocks.recordPaymentMutate).not.toHaveBeenCalled();
  });

  it("records a payment for the existing invoice and toasts on success", async () => {
    let capturedOptions: { onSuccess?: () => void } | undefined;
    mocks.recordPaymentMutate.mockImplementation((_vars, opts) => {
      capturedOptions = opts;
    });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    act(() => result.current.setExistingInvoiceId("inv-1"));
    act(() => result.current.setShowPaymentDialog(true));
    const values: PaymentFormValues = {
      amount: 25000,
      method: "card",
      reference: "ref-1",
      notes: "note",
    };
    await act(async () => result.current.handlePaymentSubmit(values));
    expect(mocks.recordPaymentMutate).toHaveBeenCalledWith(
      {
        invoiceId: "inv-1",
        amount: 25000,
        method: "card",
        reference: "ref-1",
        notes: "note",
      },
      expect.any(Object),
    );
    await act(async () => capturedOptions?.onSuccess?.());
    expect(result.current.showPaymentDialog).toBe(false);
    expect(mocks.toast.success).toHaveBeenCalledWith("paymentRecorded");
  });

  it("toasts the payment error message", async () => {
    let capturedOptions:
      | {
          onError?: (err: Error) => void;
        }
      | undefined;
    mocks.recordPaymentMutate.mockImplementation((_vars, opts) => {
      capturedOptions = opts;
    });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    act(() => result.current.setExistingInvoiceId("inv-1"));
    const values: PaymentFormValues = {
      amount: 100,
      method: "cash",
      reference: "",
      notes: "",
    };
    await act(async () => result.current.handlePaymentSubmit(values));
    await act(async () =>
      capturedOptions?.onError?.(new Error("card declined")),
    );
    expect(mocks.toast.error).toHaveBeenCalledWith("card declined");
  });

  // ── Repeat from last visit ──

  it("repeats last visit services and parts and toasts success with counts", async () => {
    mocks.useLastVisitData.mockReturnValue({
      data: {
        services: [
          {
            service_name: "Oil Change",
            service_catalog_id: "sc-1",
            quantity: 1,
            unit_price: 9000,
          },
        ],
        parts: [{ part_name: "Filter", quantity: 1, unit_price: 3000 }],
      },
    });
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => result.current.handleRepeatFromLastVisit());

    expect(mocks.addServiceMutateAsync).toHaveBeenCalledWith({
      woId: "wo-1",
      body: {
        service_catalog_id: "sc-1",
        service_name: "Oil Change",
        quantity: 1,
        unit_price: 9000,
      },
    });
    expect(mocks.addPartMutateAsync).toHaveBeenCalledWith({
      woId: "wo-1",
      body: { part_name: "Filter", quantity: 1, unit_price: 3000 },
    });
    expect(mocks.toast.success).toHaveBeenCalledWith("repeatSuccess");
    expect(result.current.showRepeatDialog).toBe(false);
  });

  it("warns about partial repetition when a mutation fails", async () => {
    mocks.useLastVisitData.mockReturnValue({
      data: {
        services: [
          {
            service_name: "Oil",
            service_catalog_id: "sc-1",
            quantity: 1,
            unit_price: 1,
          },
        ],
        parts: [{ part_name: "Filter", quantity: 1, unit_price: 1 }],
      },
    });
    mocks.addPartMutateAsync.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => result.current.handleRepeatFromLastVisit());
    expect(mocks.reportServerError).toHaveBeenCalled();
    expect(mocks.toast.warning).toHaveBeenCalledWith("repeatPartialWarning");
    expect(mocks.toast.success).not.toHaveBeenCalled();
  });

  it("does nothing when there is no last visit data", async () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    await act(async () => result.current.handleRepeatFromLastVisit());
    expect(mocks.addServiceMutateAsync).not.toHaveBeenCalled();
    expect(mocks.toast.success).not.toHaveBeenCalled();
  });

  // ── Exposed meta ──

  it("exposes the payment form schema, defaults and export columns", () => {
    const { result } = renderHook(() => useWorkOrderDetailPage(), {
      wrapper: createWrapper(),
    });
    expect(result.current.paymentForm.defaultValues).toEqual({
      amount: 0,
      method: "cash",
      reference: "",
      notes: "",
    });
    expect(
      result.current.paymentForm.schema.safeParse({ amount: -1, method: "" })
        .success,
    ).toBe(false);
    expect(
      result.current.paymentForm.schema.safeParse({
        amount: 1000,
        method: "cash",
      }).success,
    ).toBe(true);
    expect(result.current.serviceExportColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "service_name" }),
        expect.objectContaining({ key: "final_price" }),
      ]),
    );
    expect(result.current.partExportColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "part_name" }),
        expect.objectContaining({ key: "final_price" }),
      ]),
    );
    expect(result.current.detailKey).toEqual([
      "organizations",
      "org-1",
      "work-orders",
      "detail",
      "wo-1",
    ]);
  });
});
