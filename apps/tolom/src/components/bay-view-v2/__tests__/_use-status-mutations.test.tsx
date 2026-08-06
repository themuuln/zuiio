import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import { drawerDetailKeys } from "@/lib/queries/use-drawer-queries";
import type { WorkOrderDetail } from "@/lib/types";
import { useStatusMutations } from "../_use-status-mutations";

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
    vehicle_id: null,
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

interface StatusParams {
  workOrderId?: string | null;
  orgIdRef?: { current: string | null };
  orgId?: string | undefined;
  branchId?: string | undefined;
  wo?: WorkOrderDetail | null;
  setWo?: (value: WorkOrderDetail | null) => void;
  onRefresh?: () => void;
}

function renderStatus(params: StatusParams = {}) {
  const setWo = params.setWo ?? vi.fn();
  const onRefresh = params.onRefresh ?? vi.fn();
  const result = renderHook(
    () =>
      useStatusMutations({
        workOrderId: "workOrderId" in params ? params.workOrderId : "wo-1",
        orgIdRef: params.orgIdRef ?? { current: "org-1" },
        orgId: "orgId" in params ? params.orgId : "org-1",
        branchId: "branchId" in params ? params.branchId : "branch-1",
        wo: "wo" in params ? params.wo : makeWo(),
        setWo: setWo as React.Dispatch<
          React.SetStateAction<WorkOrderDetail | null>
        >,
        onRefresh,
      }),
    { wrapper: createWrapper() },
  );
  return { ...result, setWo, onRefresh };
}

// ── Tests ────────────────────────────────────────────────────────

describe("useStatusMutations", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    orgMutationMocks.configs.length = 0;
    orgMutationMocks.mutateAsync.mockResolvedValue(undefined);
  });

  describe("statusMutation config", () => {
    it("builds the PATCH endpoint, keys, and invalidation for the work order", () => {
      renderStatus();

      expect(orgMutationMocks.configs).toHaveLength(1);
      const config = orgMutationMocks.configs[0];
      expect(config.method).toBe("PATCH");
      const endpoint = config.endpoint as (vars: {
        status: string;
        notes?: string;
      }) => string;
      expect(endpoint({ status: "In Progress" })).toBe(
        "/api/organizations/org-1/work-orders/wo-1",
      );
      expect(config.queryKey).toEqual(workOrderKeys.all("org-1"));
      expect(config.optimisticQueryKey).toEqual(
        drawerDetailKeys.all("org-1", "wo-1"),
      );
      expect(config.invalidateKeys).toEqual([bayViewKeys.data("branch-1")]);
      expect(typeof config.onOptimisticUpdate).toBe("function");
      expect(typeof config.onSuccess).toBe("function");
    });

    it("omits optimistic key and invalidation when org/branch are missing", () => {
      renderStatus({ orgId: undefined, branchId: undefined });

      const config = orgMutationMocks.configs[0];
      expect(config.optimisticQueryKey).toBeUndefined();
      expect(config.invalidateKeys).toBeUndefined();
    });

    it("calls onRefresh on success", () => {
      const { onRefresh } = renderStatus();

      act(() => {
        const config = orgMutationMocks.configs[0];
        const onSuccess = config.onSuccess as () => void;
        onSuccess();
      });

      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe("onOptimisticUpdate", () => {
    it("updates the drawer detail cache status and returns a rollback snapshot", () => {
      const wo = makeWo();
      renderStatus({ wo });
      const key = drawerDetailKeys.all("org-1", "wo-1");
      queryClient.setQueryData(key, { workOrder: wo });

      const config = orgMutationMocks.configs[0];
      const onOptimisticUpdate = config.onOptimisticUpdate as (
        qc: QueryClient,
        vars: { status: string; notes?: string },
      ) => unknown;
      const snapshot = onOptimisticUpdate(queryClient, {
        status: "In Progress",
      });

      expect(queryClient.getQueryData(key)).toEqual(
        expect.objectContaining({
          workOrder: expect.objectContaining({ status: "In Progress" }),
        }),
      );
      expect(snapshot).toEqual({ workOrder: wo });

      // Rollback restores the previous state
      queryClient.setQueryData(key, snapshot);
      expect(queryClient.getQueryData(key)).toEqual(
        expect.objectContaining({
          workOrder: expect.objectContaining({ status: "New" }),
        }),
      );
    });

    it("returns the raw snapshot when the cache has no work order", () => {
      renderStatus();
      const key = drawerDetailKeys.all("org-1", "wo-1");
      queryClient.setQueryData(key, {});

      const config = orgMutationMocks.configs[0];
      const onOptimisticUpdate = config.onOptimisticUpdate as (
        qc: QueryClient,
        vars: { status: string; notes?: string },
      ) => unknown;
      const snapshot = onOptimisticUpdate(queryClient, {
        status: "In Progress",
      });

      expect(snapshot).toEqual({});
    });

    it("returns undefined without an orgId/workOrderId", () => {
      renderStatus({ orgId: undefined, workOrderId: null });

      const config = orgMutationMocks.configs[0];
      const onOptimisticUpdate = config.onOptimisticUpdate as (
        qc: QueryClient,
        vars: { status: string; notes?: string },
      ) => unknown;
      const snapshot = onOptimisticUpdate(queryClient, {
        status: "In Progress",
      });

      expect(snapshot).toBeUndefined();
    });
  });

  describe("changeStatus", () => {
    it("mutates optimistically and shows a success toast for forward transitions", async () => {
      const { result } = renderStatus();

      await act(async () => {
        await result.current.changeStatus("In Progress");
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        status: "In Progress",
      });
      expect(toastMock.dismiss).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith(
        "Status changed to In Progress",
      );
    });

    it("shows a destructive toast with an undo action for Completed", async () => {
      const wo = makeWo();
      const { result } = renderStatus({ wo });

      await act(async () => {
        await result.current.changeStatus("Completed");
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        status: "Completed",
      });
      expect(toastMock).toHaveBeenCalledWith("Status changed to Completed", {
        action: expect.objectContaining({ label: "Undo" }),
        duration: 8000,
      });

      const opts = toastMock.mock.calls.find(
        (c) => c[0] === "Status changed to Completed",
      )?.[1] as { action?: { onClick?: () => Promise<void> } };
      await act(async () => {
        await opts?.action?.onClick?.();
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenLastCalledWith({
        status: "New",
      });
    });

    it("shows an error toast when the undo fails", async () => {
      const wo = makeWo();
      const { result } = renderStatus({ wo });

      await act(async () => {
        await result.current.changeStatus("Cancelled");
      });

      const opts = toastMock.mock.calls.find(
        (c) => c[0] === "Status changed to Cancelled",
      )?.[1] as { action?: { onClick?: () => Promise<void> } };
      orgMutationMocks.mutateAsync.mockRejectedValueOnce(
        new Error("undo boom"),
      );
      await act(async () => {
        await opts?.action?.onClick?.();
      });

      expect(reportServerErrorMock).toHaveBeenCalledWith(
        "Status undo failed",
        expect.any(Error),
      );
      expect(toastMock.error).toHaveBeenCalledWith(
        "Failed to undo status change",
      );
    });

    it("rolls back the local work order state on failure", async () => {
      const wo = makeWo();
      const setWo = vi.fn();
      const { result } = renderStatus({ wo, setWo });
      orgMutationMocks.mutateAsync.mockRejectedValueOnce(new Error("boom"));

      await act(async () => {
        await result.current.changeStatus("Completed");
      });

      expect(setWo).toHaveBeenCalledWith(wo);
      expect(toastMock.success).not.toHaveBeenCalled();
    });

    it("does nothing without an org id or work order id", async () => {
      const { result } = renderStatus({
        orgIdRef: { current: null },
        workOrderId: null,
      });

      await act(async () => {
        await result.current.changeStatus("In Progress");
      });

      expect(orgMutationMocks.mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("handleStatusConfirm", () => {
    it("does nothing without a pending confirm status", async () => {
      const { result } = renderStatus();

      await act(async () => {
        await result.current.handleStatusConfirm();
      });

      expect(orgMutationMocks.mutateAsync).not.toHaveBeenCalled();
    });

    it("mutates with notes and clears the confirmation state", async () => {
      const { result } = renderStatus();

      act(() => {
        result.current.setConfirmStatus("Cancelled");
        result.current.setStatusNotes("Customer requested");
      });

      await act(async () => {
        await result.current.handleStatusConfirm();
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        status: "Cancelled",
        notes: "Customer requested",
      });
      expect(result.current.confirmStatus).toBeNull();
      expect(result.current.statusNotes).toBe("");
      expect(toastMock.success).toHaveBeenCalledWith(
        "Status changed to Cancelled",
      );
    });

    it("mutates without notes when statusNotes is empty", async () => {
      const { result } = renderStatus();

      act(() => {
        result.current.setConfirmStatus("Completed");
      });

      await act(async () => {
        await result.current.handleStatusConfirm();
      });

      expect(orgMutationMocks.mutateAsync).toHaveBeenCalledWith({
        status: "Completed",
      });
    });

    it("rolls back the work order on failure", async () => {
      const wo = makeWo();
      const setWo = vi.fn();
      const { result } = renderStatus({ wo, setWo });
      orgMutationMocks.mutateAsync.mockRejectedValueOnce(new Error("boom"));

      act(() => {
        result.current.setConfirmStatus("Completed");
      });

      await act(async () => {
        await result.current.handleStatusConfirm();
      });

      expect(setWo).toHaveBeenCalledWith(wo);
      expect(toastMock.success).not.toHaveBeenCalled();
    });
  });

  describe("canCancel", () => {
    it("is true for an active work order", () => {
      const { result } = renderStatus({
        wo: makeWo({ status: "In Progress" }),
      });
      expect(result.current.canCancel).toBe(true);
    });

    it("is false for Completed/Cancelled work orders", () => {
      const { result: completed } = renderStatus({
        wo: makeWo({ status: "Completed" }),
      });
      const { result: cancelled } = renderStatus({
        wo: makeWo({ status: "Cancelled" }),
      });
      expect(completed.current.canCancel).toBe(false);
      expect(cancelled.current.canCancel).toBe(false);
    });

    it("is false without a work order", () => {
      const { result } = renderStatus({ wo: null });
      expect(result.current.canCancel).toBe(false);
    });
  });
});
