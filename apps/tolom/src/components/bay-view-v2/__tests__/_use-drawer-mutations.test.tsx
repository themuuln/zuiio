import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import { drawerDetailKeys } from "@/lib/queries/use-drawer-queries";
import type { WorkOrderDetail } from "@/lib/types";
import { DEFAULT_PAYMENT_METHOD_FEES } from "../_payment-fees";
import { useDrawerMutations } from "../_use-drawer-mutations";

// ── Hoisted mocks ────────────────────────────────────────────────

const orgMutationMocks = vi.hoisted(() => {
  const configs: Array<Record<string, unknown>> = [];
  const mutate = vi.fn();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  let pending = false;
  return {
    configs,
    mutate,
    mutateAsync,
    setPending: (value: boolean) => {
      pending = value;
    },
    useOrgMutation: vi.fn((config: Record<string, unknown>) => {
      configs.push(config);
      return { mutate, mutateAsync, isPending: pending };
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
    status: "New",
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

interface PrebuiltMutation {
  mutateAsync: (
    vars:
      | { woId: string; mechanicId: string }
      | {
          woId: string;
          customerId: string | null;
          customerName?: string | null;
        },
  ) => Promise<unknown>;
  isPending?: boolean;
}

interface DrawerParams {
  workOrderId?: string | null;
  orgIdRef?: { current: string | null };
  orgId?: string | undefined;
  branchId?: string | undefined;
  wo?: WorkOrderDetail | null;
  setWo?: (value: WorkOrderDetail | null) => void;
  fetchWo?: (silent?: boolean, orgIdOverride?: string) => Promise<void>;
  onRefresh?: () => void;
  onOpenChange?: (open: boolean) => void;
  assignMechanicMutation?: PrebuiltMutation;
  assignCustomerMutation?: PrebuiltMutation;
}

function renderDrawer(params: DrawerParams = {}) {
  const setWo = params.setWo ?? vi.fn();
  const fetchWo = params.fetchWo ?? vi.fn().mockResolvedValue(undefined);
  const onRefresh = params.onRefresh ?? vi.fn();
  const onOpenChange = params.onOpenChange ?? vi.fn();
  const render = renderHook(
    () =>
      useDrawerMutations({
        workOrderId: "workOrderId" in params ? params.workOrderId : "wo-1",
        orgIdRef: params.orgIdRef ?? { current: "org-1" },
        orgId: "orgId" in params ? params.orgId : "org-1",
        wo: "wo" in params ? params.wo : makeWo(),
        setWo: setWo as React.Dispatch<
          React.SetStateAction<WorkOrderDetail | null>
        >,
        fetchWo,
        onRefresh,
        onOpenChange,
        paymentMethodFees: DEFAULT_PAYMENT_METHOD_FEES,
        transferBanks: [],
        branchId: "branchId" in params ? params.branchId : "branch-1",
        assignMechanicMutation: params.assignMechanicMutation,
        assignCustomerMutation: params.assignCustomerMutation,
      }),
    { wrapper: createWrapper() },
  );
  return { ...render, setWo, fetchWo, onRefresh, onOpenChange };
}

// ── Tests ────────────────────────────────────────────────────────

describe("useDrawerMutations", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    orgMutationMocks.configs.length = 0;
    orgMutationMocks.setPending(false);
    orgMutationMocks.mutateAsync.mockResolvedValue(undefined);
  });

  describe("patchWorkOrderMutation config", () => {
    it("builds the PATCH endpoint, keys, and invalidation", () => {
      const { onRefresh } = renderDrawer();

      const config = orgMutationMocks.configs.at(-1);
      expect(config?.method).toBe("PATCH");
      const endpoint = config?.endpoint as () => string;
      expect(endpoint()).toBe("/api/organizations/org-1/work-orders/wo-1");
      expect(config?.queryKey).toEqual(workOrderKeys.all("org-1"));
      expect(config?.optimisticQueryKey).toEqual(
        drawerDetailKeys.all("org-1", "wo-1"),
      );
      expect(config?.invalidateKeys).toEqual([bayViewKeys.data("branch-1")]);

      const onSuccess = config?.onSuccess as () => void;
      act(() => onSuccess());
      expect(onRefresh).toHaveBeenCalled();
    });

    it("omits optimistic key and invalidation when org/work order/branch are missing", () => {
      renderDrawer({
        orgId: undefined,
        branchId: undefined,
        workOrderId: null,
      });

      const config = orgMutationMocks.configs.at(-1);
      expect(config?.optimisticQueryKey).toBeUndefined();
      expect(config?.invalidateKeys).toBeUndefined();
    });
  });

  describe("saving", () => {
    it("is false when no mutation is pending", () => {
      const { result } = renderDrawer();
      expect(result.current.saving).toBe(false);
    });

    it("reflects the pre-built mechanic mutation pending state", () => {
      const { result } = renderDrawer({
        assignMechanicMutation: { mutateAsync: vi.fn(), isPending: true },
      });
      expect(result.current.saving).toBe(true);
    });

    it("reflects the pre-built customer mutation pending state", () => {
      const { result } = renderDrawer({
        assignCustomerMutation: { mutateAsync: vi.fn(), isPending: true },
      });
      expect(result.current.saving).toBe(true);
    });

    it("reflects the fallback patch mutation pending state", () => {
      orgMutationMocks.setPending(true);
      const { result } = renderDrawer();
      expect(result.current.saving).toBe(true);
    });
  });

  describe("assignMechanic", () => {
    it("optimistically assigns the mechanic via the pre-built mutation", async () => {
      const wo = makeWo();
      const setWo = vi.fn();
      const onRefresh = vi.fn();
      const assignMechanicMutation = {
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      };
      const { result } = renderDrawer({
        wo,
        setWo,
        onRefresh,
        assignMechanicMutation,
      });

      await act(async () => {
        await result.current.assignMechanic("mech-1", "John Doe");
      });

      expect(assignMechanicMutation.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        mechanicId: "mech-1",
      });
      expect(setWo).toHaveBeenCalledTimes(1);
      const updater = setWo.mock.calls[0][0] as (
        prev: WorkOrderDetail | null,
      ) => WorkOrderDetail | null;
      expect(updater(wo)).toMatchObject({
        mechanic_id: "mech-1",
        mechanic: { id: "mech-1", full_name: "John Doe" },
      });
      expect(onRefresh).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith("Mechanic assigned");
    });

    it("optimistically removes the mechanic when the id is empty", async () => {
      const wo = makeWo({ mechanic_id: "mech-1" });
      const setWo = vi.fn();
      const assignMechanicMutation = {
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      };
      const { result } = renderDrawer({ wo, setWo, assignMechanicMutation });

      await act(async () => {
        await result.current.assignMechanic("");
      });

      expect(assignMechanicMutation.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        mechanicId: "",
      });
      const updater = setWo.mock.calls[0][0] as (
        prev: WorkOrderDetail | null,
      ) => WorkOrderDetail | null;
      expect(updater(wo)).toMatchObject({
        mechanic_id: null,
        mechanic: null,
      });
      expect(toastMock.success).toHaveBeenCalledWith("Mechanic removed");
    });

    it("falls back to the PATCH mutation when no pre-built hook is provided", async () => {
      const onRefresh = vi.fn();
      const { result } = renderDrawer({ onRefresh });

      await act(async () => {
        await result.current.assignMechanic("mech-1");
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        mechanic_id: "mech-1",
      });
      expect(onRefresh).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith("Mechanic assigned");
    });

    it("rolls back the optimistic state and toasts on failure", async () => {
      const wo = makeWo();
      const setWo = vi.fn();
      const assignMechanicMutation = {
        mutateAsync: vi.fn().mockRejectedValue(new Error("network down")),
      };
      const { result } = renderDrawer({ wo, setWo, assignMechanicMutation });

      await act(async () => {
        await result.current.assignMechanic("mech-1");
      });

      expect(setWo).toHaveBeenLastCalledWith(wo);
      expect(reportServerErrorMock).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      );
      expect(toastMock.error).toHaveBeenCalledWith("network down");
      expect(toastMock.success).not.toHaveBeenCalled();
    });

    it("does nothing without an org id or work order id", async () => {
      const setWo = vi.fn();
      const { result } = renderDrawer({
        orgIdRef: { current: null },
        setWo,
      });

      await act(async () => {
        await result.current.assignMechanic("mech-1");
      });

      expect(setWo).not.toHaveBeenCalled();
      expect(orgMutationMocks.mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("assignCustomer", () => {
    it("optimistically assigns the customer via the pre-built mutation", async () => {
      const wo = makeWo();
      const setWo = vi.fn();
      const onRefresh = vi.fn();
      const assignCustomerMutation = {
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      };
      const { result } = renderDrawer({
        wo,
        setWo,
        onRefresh,
        assignCustomerMutation,
      });

      await act(async () => {
        await result.current.assignCustomer("cust-1", "Alice");
      });

      expect(assignCustomerMutation.mutateAsync).toHaveBeenCalledWith({
        woId: "wo-1",
        customerId: "cust-1",
        customerName: "Alice",
      });
      const updater = setWo.mock.calls[0][0] as (
        prev: WorkOrderDetail | null,
      ) => WorkOrderDetail | null;
      expect(updater(wo)).toMatchObject({
        customer_id: "cust-1",
        customer: expect.objectContaining({ id: "cust-1" }),
      });
      expect(onRefresh).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith("Customer assigned");
    });

    it("keeps the existing customer object when reassigning", async () => {
      const existingCustomer = {
        id: "cust-1",
        full_name: "Alice",
        company_name: null,
      };
      const wo = makeWo({
        customer_id: "cust-1",
        customer: existingCustomer as WorkOrderDetail["customer"],
      });
      const setWo = vi.fn();
      const assignCustomerMutation = {
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      };
      const { result } = renderDrawer({ wo, setWo, assignCustomerMutation });

      await act(async () => {
        await result.current.assignCustomer("cust-1", "Alice");
      });

      const updater = setWo.mock.calls[0][0] as (
        prev: WorkOrderDetail | null,
      ) => WorkOrderDetail | null;
      expect(updater(wo)).toMatchObject({ customer: existingCustomer });
    });

    it("clears the customer without a success toast when id is null", async () => {
      const wo = makeWo({ customer_id: "cust-1" });
      const setWo = vi.fn();
      const assignCustomerMutation = {
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      };
      const { result } = renderDrawer({ wo, setWo, assignCustomerMutation });

      await act(async () => {
        await result.current.assignCustomer(null);
      });

      const updater = setWo.mock.calls[0][0] as (
        prev: WorkOrderDetail | null,
      ) => WorkOrderDetail | null;
      expect(updater(wo)).toMatchObject({ customer_id: null, customer: null });
      expect(toastMock.success).not.toHaveBeenCalled();
    });

    it("falls back to the PATCH mutation when no pre-built hook is provided", async () => {
      const { result } = renderDrawer();

      await act(async () => {
        await result.current.assignCustomer("cust-1", "Alice");
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        customer_id: "cust-1",
      });
      expect(toastMock.success).toHaveBeenCalledWith("Customer assigned");
    });

    it("rolls back the optimistic state and toasts on failure", async () => {
      const wo = makeWo();
      const setWo = vi.fn();
      const assignCustomerMutation = {
        mutateAsync: vi.fn().mockRejectedValue(new Error("network down")),
      };
      const { result } = renderDrawer({ wo, setWo, assignCustomerMutation });

      await act(async () => {
        await result.current.assignCustomer("cust-1");
      });

      expect(setWo).toHaveBeenLastCalledWith(wo);
      expect(toastMock.error).toHaveBeenCalledWith("network down");
    });
  });

  describe("drawer close handling", () => {
    it("isDirty is false initially and true when add forms are open", () => {
      const { result } = renderDrawer();
      expect(result.current.isDirty).toBe(false);

      act(() => result.current.setShowAddService(true));
      expect(result.current.isDirty).toBe(true);
    });

    it("closes the drawer directly when nothing is dirty", () => {
      const onOpenChange = vi.fn();
      const { result } = renderDrawer({ onOpenChange });

      act(() => result.current.handleOpenChange(false));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(result.current.showUnsavedWarning).toBe(false);
    });

    it("shows the unsaved warning instead of closing when dirty", () => {
      const onOpenChange = vi.fn();
      const { result } = renderDrawer({ onOpenChange });

      act(() => result.current.setShowAddService(true));
      act(() => result.current.handleOpenChange(false));

      expect(result.current.showUnsavedWarning).toBe(true);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("allows opening while dirty", () => {
      const onOpenChange = vi.fn();
      const { result } = renderDrawer({ onOpenChange });

      act(() => result.current.setShowAddPart(true));
      act(() => result.current.handleOpenChange(true));

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(result.current.showUnsavedWarning).toBe(false);
    });

    it("handleSaveAndClose clears dirty state and closes", () => {
      const onOpenChange = vi.fn();
      const { result } = renderDrawer({ onOpenChange });

      act(() => {
        result.current.setShowAddService(true);
        result.current.setShowAddPart(true);
      });
      act(() => result.current.handleSaveAndClose());

      expect(result.current.showAddService).toBe(false);
      expect(result.current.showAddPart).toBe(false);
      expect(result.current.showUnsavedWarning).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("handleDiscard clears dirty state and closes", () => {
      const onOpenChange = vi.fn();
      const { result } = renderDrawer({ onOpenChange });

      act(() => {
        result.current.setShowUnsavedWarning(true);
        result.current.setShowAddService(true);
      });
      act(() => result.current.handleDiscard());

      expect(result.current.showAddService).toBe(false);
      expect(result.current.showUnsavedWarning).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("domain hook wiring", () => {
    it("exposes status, invoice, service, and part handlers", () => {
      const { result } = renderDrawer();

      expect(typeof result.current.changeStatus).toBe("function");
      expect(typeof result.current.handleStatusConfirm).toBe("function");
      expect(typeof result.current.generateInvoice).toBe("function");
      expect(typeof result.current.handleReadyForPickup).toBe("function");
      expect(typeof result.current.addService).toBe("function");
      expect(typeof result.current.removeService).toBe("function");
      expect(typeof result.current.addPart).toBe("function");
      expect(typeof result.current.removePart).toBe("function");
      expect(result.current.handleAddService).toBe(result.current.addService);
      expect(result.current.handleRemoveService).toBe(
        result.current.removeService,
      );
      expect(result.current.handlePostServiceConfirm).toBe(
        result.current.handlePostServiceFormSubmit,
      );
    });
  });
});
