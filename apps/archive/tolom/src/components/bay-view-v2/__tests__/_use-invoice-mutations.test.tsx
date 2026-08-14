import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import { drawerDetailKeys } from "@/lib/queries/use-drawer-queries";
import type { WorkOrderDetail } from "@/lib/types";
import { DEFAULT_PAYMENT_METHOD_FEES } from "../_payment-fees";
import type { PostServiceFormData } from "../_schema";
import { useInvoiceMutations } from "../_use-invoice-mutations";

// ── Hoisted mocks ────────────────────────────────────────────────

const orgMutationMocks = vi.hoisted(() => {
  const configs: Array<Record<string, unknown>> = [];
  const mutate = vi.fn();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  return {
    configs,
    mutate,
    mutateAsync,
    useOrgMutation: vi.fn((config: Record<string, unknown>) => {
      configs.push(config);
      return { mutate, mutateAsync, isPending: false };
    }),
  };
});
vi.mock("@zuiio/query", () => ({
  useOrgMutation: orgMutationMocks.useOrgMutation,
}));

const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  }),
);
vi.mock("sonner", () => ({ toast: toastMock }));

const reportServerErrorMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

const postServiceServiceMock = vi.hoisted(() => ({
  getWorkOrderParts: vi.fn().mockResolvedValue([]),
  getWorkOrderServicesWithIntervals: vi.fn().mockResolvedValue([]),
  savePostServiceData: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/post-service-service", () => postServiceServiceMock);

const paymentHelpersMock = vi.hoisted(() => ({
  createInvoiceAndRecordPayment: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../_payment-helpers", () => paymentHelpersMock);

// ── Fixtures ─────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function makeWo(overrides: Partial<WorkOrderDetail> = {}): WorkOrderDetail {
  return {
    id: "wo-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    customer_id: null,
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
    subtotal: 0,
    total: 0,
    completed_at: null,
    started_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    customer: null,
    vehicle: null,
    mechanic: null,
    helpers: [],
    services: [],
    parts: [],
    status_history: [],
    service_history: [],
    ...overrides,
  } as unknown as WorkOrderDetail;
}

function makeWoWithLineItems(): WorkOrderDetail {
  return makeWo({
    services: [
      { id: "svc-1", final_price: "50000" },
    ] as unknown as WorkOrderDetail["services"],
    parts: [
      { id: "part-1", final_price: "30000" },
    ] as unknown as WorkOrderDetail["parts"],
  });
}

interface InvoiceParams {
  workOrderId?: string | null;
  orgIdRef?: { current: string | null };
  orgId?: string | undefined;
  branchId?: string | undefined;
  wo?: WorkOrderDetail | null;
  setWo?: (value: WorkOrderDetail | null) => void;
  fetchWo?: (silent?: boolean, orgIdOverride?: string) => Promise<void>;
  onRefresh?: () => void;
}

function renderInvoice(params: InvoiceParams = {}) {
  const setWo = params.setWo ?? vi.fn();
  const fetchWo = params.fetchWo ?? vi.fn().mockResolvedValue(undefined);
  const onRefresh = params.onRefresh ?? vi.fn();
  const render = renderHook(
    () =>
      useInvoiceMutations({
        workOrderId: "workOrderId" in params ? params.workOrderId : "wo-1",
        orgIdRef: params.orgIdRef ?? { current: "org-1" },
        orgId: "orgId" in params ? params.orgId : "org-1",
        branchId: "branchId" in params ? params.branchId : "branch-1",
        wo: params.wo ?? makeWo(),
        setWo: setWo as React.Dispatch<
          React.SetStateAction<WorkOrderDetail | null>
        >,
        fetchWo,
        onRefresh,
        paymentMethodFees: DEFAULT_PAYMENT_METHOD_FEES,
        transferBanks: [],
      }),
    { wrapper: createWrapper() },
  );
  return { ...render, setWo, fetchWo, onRefresh };
}

const formData: PostServiceFormData = {
  odometerReading: 15000,
  recommendations: [],
  mechanicNotes: "Oil changed",
  paymentMethod: "cash",
  transferBankId: undefined,
};

// ── Tests ────────────────────────────────────────────────────────

describe("useInvoiceMutations", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    orgMutationMocks.configs.length = 0;
    orgMutationMocks.mutateAsync.mockResolvedValue(undefined);
    postServiceServiceMock.savePostServiceData.mockResolvedValue(undefined);
    paymentHelpersMock.createInvoiceAndRecordPayment.mockResolvedValue(
      undefined,
    );
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  describe("mutation configs", () => {
    it("configures the create-invoice POST endpoint and invalidation", () => {
      renderInvoice();

      expect(orgMutationMocks.configs).toHaveLength(2);
      const createConfig = orgMutationMocks.configs[0];
      expect(createConfig.method).toBe("POST");
      const endpoint = createConfig.endpoint as () => string;
      expect(endpoint()).toBe("/api/organizations/org-1/invoices");
      expect(createConfig.queryKey).toEqual(workOrderKeys.all("org-1"));
      expect(createConfig.invalidateKeys).toEqual([
        bayViewKeys.data("branch-1"),
      ]);
    });

    it("configures the status PATCH with optimistic drawer key and refresh on success", () => {
      const { onRefresh } = renderInvoice();

      const statusConfig = orgMutationMocks.configs[1];
      expect(statusConfig.method).toBe("PATCH");
      const endpoint = statusConfig.endpoint as (vars: {
        status: string;
        notes?: string;
      }) => string;
      expect(endpoint({ status: "Ready for Pickup" })).toBe(
        "/api/organizations/org-1/work-orders/wo-1",
      );
      expect(statusConfig.optimisticQueryKey).toEqual(
        drawerDetailKeys.all("org-1", "wo-1"),
      );
      const onSuccess = statusConfig.onSuccess as () => void;
      act(() => onSuccess());
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe("generateInvoice", () => {
    it("creates the invoice, toasts, opens it, and stores the public token", async () => {
      orgMutationMocks.mutateAsync.mockResolvedValueOnce({
        invoice_number: "INV-1",
        public_token: "tok-1",
      });
      const { result } = renderInvoice();

      await act(async () => {
        await result.current.generateInvoice();
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        work_order_id: "wo-1",
      });
      expect(toastMock.success).toHaveBeenCalledWith("Invoice INV-1 created");
      expect(vi.mocked(window.open)).toHaveBeenCalledWith(
        "/invoice/tok-1",
        "_blank",
      );
      expect(result.current.invoicePublicToken).toBe("tok-1");
      expect(result.current.creatingInvoice).toBe(false);
    });

    it("does nothing without an org id or work order id", async () => {
      const { result } = renderInvoice({
        orgIdRef: { current: null },
        workOrderId: null,
      });

      await act(async () => {
        await result.current.generateInvoice();
      });

      expect(orgMutationMocks.mutateAsync).not.toHaveBeenCalled();
      expect(result.current.creatingInvoice).toBe(false);
    });

    it("shows an error toast and resets creating state on failure", async () => {
      orgMutationMocks.mutateAsync.mockRejectedValueOnce(new Error("boom"));
      const { result } = renderInvoice();

      await act(async () => {
        await result.current.generateInvoice();
      });

      expect(toastMock.error).toHaveBeenCalledWith("Failed to create invoice");
      expect(result.current.creatingInvoice).toBe(false);
    });
  });

  describe("handleReadyForPickup", () => {
    it("loads post-service services and parts when the WO has a vehicle", async () => {
      postServiceServiceMock.getWorkOrderServicesWithIntervals.mockResolvedValueOnce(
        [{ id: "svc-1", service_name: "Oil" }],
      );
      postServiceServiceMock.getWorkOrderParts.mockResolvedValueOnce([
        { id: "part-1", part_name: "Filter" },
      ]);
      const { result } = renderInvoice();

      await act(async () => {
        result.current.handleReadyForPickup();
      });

      await waitFor(() =>
        expect(result.current.postFormServices).toEqual([
          { id: "svc-1", service_name: "Oil" },
        ]),
      );
      await waitFor(() =>
        expect(result.current.postFormParts).toEqual([
          { id: "part-1", part_name: "Filter" },
        ]),
      );
    });

    it("reports errors when loading post-service data fails", async () => {
      postServiceServiceMock.getWorkOrderServicesWithIntervals.mockRejectedValueOnce(
        new Error("load failed"),
      );
      const { result } = renderInvoice();

      await act(async () => {
        result.current.handleReadyForPickup();
      });

      await waitFor(() =>
        expect(reportServerErrorMock).toHaveBeenCalledWith(
          "Failed to load post-service services",
          expect.any(Error),
        ),
      );
    });

    it("updates status optimistically when the WO has no vehicle", async () => {
      const wo = makeWo({ vehicle_id: null });
      const setWo = vi.fn();
      const { result } = renderInvoice({ wo, setWo });

      await act(async () => {
        await result.current.handleReadyForPickup();
      });

      expect(setWo).toHaveBeenCalledTimes(1);
      const updater = setWo.mock.calls[0][0] as (
        prev: WorkOrderDetail | null,
      ) => WorkOrderDetail | null;
      expect(updater(wo)).toMatchObject({ status: "Ready for Pickup" });
      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        status: "Ready for Pickup",
      });
    });

    it("rolls back the optimistic status on failure", async () => {
      const wo = makeWo({ vehicle_id: null });
      const setWo = vi.fn();
      const { result } = renderInvoice({ wo, setWo });
      orgMutationMocks.mutateAsync.mockRejectedValueOnce(new Error("boom"));

      await act(async () => {
        await result.current.handleReadyForPickup();
      });

      expect(setWo).toHaveBeenLastCalledWith(wo);
    });
  });

  describe("handlePostServiceFormSubmit", () => {
    it("does nothing without a work order or vehicle", async () => {
      const { result } = renderInvoice({ workOrderId: null });

      await act(async () => {
        await result.current.handlePostServiceFormSubmit(formData);
      });

      expect(postServiceServiceMock.savePostServiceData).not.toHaveBeenCalled();
    });

    it("saves data, updates status, records payment, and refreshes", async () => {
      const wo = makeWoWithLineItems();
      const setWo = vi.fn();
      const fetchWo = vi.fn().mockResolvedValue(undefined);
      const onRefresh = vi.fn();
      const { result } = renderInvoice({ wo, setWo, fetchWo, onRefresh });

      await act(async () => {
        await result.current.handlePostServiceFormSubmit(formData);
      });

      expect(postServiceServiceMock.savePostServiceData).toHaveBeenCalledWith({
        workOrderId: "wo-1",
        vehicleId: "veh-1",
        odometerReading: 15000,
        recommendations: [],
        mechanicNotes: "Oil changed",
      });
      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        status: "Ready for Pickup",
        notes: "Oil changed",
      });
      expect(
        paymentHelpersMock.createInvoiceAndRecordPayment,
      ).toHaveBeenCalledWith(
        "org-1",
        "wo-1",
        "cash",
        DEFAULT_PAYMENT_METHOD_FEES.cash,
        [],
        undefined,
      );
      expect(fetchWo).toHaveBeenCalledWith(true);
      expect(toastMock.success).toHaveBeenCalledWith(
        "Ready for Pickup — recommendations saved",
      );
      expect(onRefresh).toHaveBeenCalled();
      expect(result.current.showPostServiceForm).toBe(false);
      expect(result.current.postFormServices).toEqual([]);
      expect(result.current.postFormParts).toEqual([]);
    });

    it("omits notes when mechanic notes are empty", async () => {
      const { result } = renderInvoice({ wo: makeWoWithLineItems() });

      await act(async () => {
        await result.current.handlePostServiceFormSubmit({
          ...formData,
          mechanicNotes: "",
        });
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        status: "Ready for Pickup",
        notes: undefined,
      });
    });

    it("skips payment recording when the grand total is zero", async () => {
      const { result } = renderInvoice();

      await act(async () => {
        await result.current.handlePostServiceFormSubmit(formData);
      });

      expect(
        paymentHelpersMock.createInvoiceAndRecordPayment,
      ).not.toHaveBeenCalled();
    });

    it("warns but keeps the flow going when payment recording fails", async () => {
      paymentHelpersMock.createInvoiceAndRecordPayment.mockRejectedValueOnce(
        new Error("pay failed"),
      );
      const fetchWo = vi.fn().mockResolvedValue(undefined);
      const onRefresh = vi.fn();
      const { result } = renderInvoice({
        wo: makeWoWithLineItems(),
        fetchWo,
        onRefresh,
      });

      await act(async () => {
        await result.current.handlePostServiceFormSubmit(formData);
      });

      expect(reportServerErrorMock).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      );
      expect(toastMock.warning).toHaveBeenCalledWith("pay failed");
      expect(toastMock.success).toHaveBeenCalledWith(
        "Ready for Pickup — recommendations saved",
      );
      expect(fetchWo).toHaveBeenCalledWith(true);
      expect(onRefresh).toHaveBeenCalled();
    });

    it("rolls back the status and errors when saving fails", async () => {
      const wo = makeWoWithLineItems();
      const setWo = vi.fn();
      const { result } = renderInvoice({ wo, setWo });
      postServiceServiceMock.savePostServiceData.mockRejectedValueOnce(
        new Error("save failed"),
      );

      await act(async () => {
        await result.current.handlePostServiceFormSubmit(formData);
      });

      expect(setWo).toHaveBeenLastCalledWith(wo);
      expect(toastMock.error).toHaveBeenCalledWith(
        "Failed to save post-service data",
      );
      expect(orgMutationMocks.mutateAsync).not.toHaveBeenCalled();
    });

    it("sets the optimistic Ready for Pickup status before saving", async () => {
      const wo = makeWoWithLineItems();
      const setWo = vi.fn();
      const { result } = renderInvoice({ wo, setWo });

      await act(async () => {
        await result.current.handlePostServiceFormSubmit(formData);
      });

      expect(setWo).toHaveBeenCalledTimes(1);
      const updater = setWo.mock.calls[0][0] as (
        prev: WorkOrderDetail | null,
      ) => WorkOrderDetail | null;
      expect(updater(wo)).toMatchObject({ status: "Ready for Pickup" });
    });
  });

  describe("handleCancelPostService", () => {
    it("hides the form and clears its data", async () => {
      const { result } = renderInvoice();

      act(() => {
        result.current.setShowPostServiceForm(true);
        result.current.setPostFormServices([
          {
            id: "s1",
            service_name: "Oil change",
            service_catalog_id: null,
            catalog_interval_months: null,
            catalog_interval_km: null,
          },
        ]);
        result.current.setPostFormParts([
          {
            id: "p1",
            part_name: "Filter",
            part_number: null,
            quantity: 1,
            unit_price: 10000,
            final_price: 10000,
          },
        ]);
      });

      act(() => result.current.handleCancelPostService());

      expect(result.current.showPostServiceForm).toBe(false);
      expect(result.current.postFormServices).toEqual([]);
      expect(result.current.postFormParts).toEqual([]);
    });
  });

  describe("canInvoice", () => {
    it("is true for Completed work orders", () => {
      const { result } = renderInvoice({
        wo: makeWo({ status: "Completed" }),
      });
      expect(result.current.canInvoice).toBe(true);
    });

    it("is true for Ready for Pickup work orders", () => {
      const { result } = renderInvoice({
        wo: makeWo({ status: "Ready for Pickup" }),
      });
      expect(result.current.canInvoice).toBe(true);
    });

    it("is false for other statuses and missing work orders", () => {
      const { result: active } = renderInvoice({
        wo: makeWo({ status: "New" }),
      });
      const { result: none } = renderInvoice({ wo: null });
      expect(active.current.canInvoice).toBe(false);
      expect(none.current.canInvoice).toBe(false);
    });
  });

  describe("invoicePublicToken", () => {
    it("initializes from the work order and syncs when it changes", () => {
      const wo = makeWo({ invoice_public_token: "tok-init" });
      const { result, rerender } = renderHook(
        (props: InvoiceParams) =>
          useInvoiceMutations({
            workOrderId: "wo-1",
            orgIdRef: { current: "org-1" },
            orgId: "org-1",
            branchId: "branch-1",
            wo: props.wo ?? makeWo(),
            setWo: props.setWo as React.Dispatch<
              React.SetStateAction<WorkOrderDetail | null>
            >,
            fetchWo: props.fetchWo ?? vi.fn().mockResolvedValue(undefined),
            onRefresh: props.onRefresh ?? vi.fn(),
            paymentMethodFees: DEFAULT_PAYMENT_METHOD_FEES,
            transferBanks: [],
          }),
        {
          initialProps: { wo },
          wrapper: createWrapper(),
        },
      );

      expect(result.current.invoicePublicToken).toBe("tok-init");

      act(() => {
        rerender({ wo: makeWo({ invoice_public_token: "tok-2" }) });
      });

      expect(result.current.invoicePublicToken).toBe("tok-2");
    });
  });
});
