import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { render } from "@/test/test-utils";
import type { WorkOrderDetailDrawerProps } from "../_drawer-types";
import { WorkOrderDetailDrawer } from "../work-order-detail-drawer";

const tMock = vi.hoisted(() => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}[${Object.values(params).join("|")}]` : key,
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => tMock.t,
  };
});

vi.mock("@/components/ui/detail-drawer", () => ({
  DetailDrawer: Object.assign(
    ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div data-testid="detail-drawer">{children}</div> : null,
    {
      Header: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-header">{children}</div>
      ),
      Title: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-title">{children}</div>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-description">{children}</div>
      ),
      Body: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-body">{children}</div>
      ),
      Footer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer">{children}</div>
      ),
      FooterActions: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer-actions">{children}</div>
      ),
    },
  ),
}));

const queriesMock = vi.hoisted(() => ({
  wo: null as WorkOrderDetail | null,
  isLoading: false,
  error: null as Error | null,
  setWo: vi.fn(),
  orgSettings: {
    default_tax_rate: 0,
    payment_method_fees: null,
    transfer_bank_accounts: null,
  },
  mechanics: [] as { id: string; full_name: string }[],
}));
vi.mock("@/lib/queries/use-drawer-queries", () => ({
  drawerDetailKeys: {
    all: (orgId: string, woId: string) =>
      ["drawer-detail", orgId, woId] as const,
  },
  useDrawerQueries: () => ({
    orgId: "org-1",
    orgIdRef: { current: "org-1" },
    wo: queriesMock.wo,
    setWo: queriesMock.setWo,
    isLoading: queriesMock.isLoading,
    isError: !!queriesMock.error,
    error: queriesMock.error,
  }),
  useDrawerCatalogs: () => ({
    catalog: [],
    partsCatalog: [],
    lowStockMap: {},
    mechanics: queriesMock.mechanics,
    orgSettings: queriesMock.orgSettings,
    isPending: false,
  }),
}));

const mutationsMock = vi.hoisted(() => ({
  saving: false,
  serviceSearch: "",
  setServiceSearch: vi.fn(),
  showAddService: false,
  setShowAddService: vi.fn(),
  showAddPart: false,
  setShowAddPart: vi.fn(),
  partSearch: "",
  setPartSearch: vi.fn(),
  confirmStatus: null as string | null,
  setConfirmStatus: vi.fn(),
  statusNotes: "",
  setStatusNotes: vi.fn(),
  creatingInvoice: false,
  showPostServiceForm: false,
  showUnsavedWarning: false,
  setShowUnsavedWarning: vi.fn(),
  addService: vi.fn(),
  addPart: vi.fn(),
  handleServicePriceSave: vi.fn(),
  handleServiceQtySave: vi.fn(),
  handlePartPriceSave: vi.fn(),
  handlePartQtySave: vi.fn(),
  assignMechanic: vi.fn(),
  assignCustomer: vi.fn(),
  changeStatus: vi.fn(),
  generateInvoice: vi.fn(),
  handleCancelPostService: vi.fn(),
  handleOpenChange: vi.fn(),
  handleSaveAndClose: vi.fn(),
  handleDiscard: vi.fn(),
  canCancel: false,
  canInvoice: false,
  invoicePublicToken: null as string | null,
  lastAddedServiceId: null as string | null,
  lastAddedPartId: null as string | null,
}));
vi.mock("../_use-drawer-mutations", () => ({
  useDrawerMutations: () => mutationsMock,
}));

vi.mock("../_drawer-header", () => ({
  DrawerHeaderSection: ({
    wo,
    onClose,
  }: {
    wo: WorkOrderDetail | null;
    onClose: () => void;
  }) => (
    <div data-testid="drawer-header-section">
      {wo ? (
        <span data-testid="header-plate">{wo.vehicle?.plate_number}</span>
      ) : null}
      <button aria-label="Close" onClick={onClose} type="button">
        Close
      </button>
    </div>
  ),
}));

vi.mock("../_drawer-content-panel", () => ({
  DrawerContentPanel: () => <div data-testid="content-panel" />,
}));

// Ready-for-pickup flow: nested forms render a submit trigger only when shown
vi.mock("../_drawer-nested-forms", () => ({
  DrawerNestedForms: ({
    showReadyForm,
    onReadyForPickupSubmit,
  }: {
    showReadyForm: boolean;
    onReadyForPickupSubmit: (data: {
      odometerReading: number | null;
      mechanicNotes: string;
      paymentMethod: string;
      transferBankId: string | null;
    }) => Promise<void>;
  }) =>
    showReadyForm ? (
      <button
        type="button"
        onClick={() =>
          onReadyForPickupSubmit({
            odometerReading: 72000,
            mechanicNotes: "Ready",
            paymentMethod: "cash",
            transferBankId: null,
          })
        }
      >
        ready-submit
      </button>
    ) : null,
}));

const postServiceMock = vi.hoisted(() => ({
  savePostServiceData: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/post-service-service", () => postServiceMock);

const paymentHelpersMock = vi.hoisted(() => ({
  createInvoiceAndRecordPayment: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../_payment-helpers", () => paymentHelpersMock);

vi.mock("qrcode", () => ({
  __esModule: true,
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,xxx"),
  },
}));

const orgMutationMocks = vi.hoisted(() => {
  const results: {
    mutateAsync: ReturnType<typeof vi.fn>;
  }[] = [];
  return {
    results,
    useOrgMutation: vi.fn(() => {
      const entry = { mutateAsync: vi.fn().mockResolvedValue({}) };
      results.push(entry);
      return entry;
    }),
  };
});
vi.mock("@zuiio/query", () => ({
  useOrgMutation: orgMutationMocks.useOrgMutation,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: toastMock }));

const BASE_WO: WorkOrderDetail = {
  id: "wo-1",
  organization_id: "org-1",
  branch_id: null,
  customer_id: null,
  vehicle_id: "v1",
  mechanic_id: null,
  status: "In Progress",
  complaint: null,
  diagnosis: null,
  description: null,
  notes: null,
  mechanic_notes: null,
  diagnosis_label_id: null,
  bay_number: 3,
  queue_order: 0,
  odometer_at_service: null,
  discount_amount: 0,
  discount_percentage: 0,
  discount_total: 0,
  subtotal: 0,
  total: 0,
  completed_at: null,
  started_at: null,
  created_at: "2026-08-01T09:00:00",
  updated_at: "2026-08-01T09:00:00",
  created_by: null,
  updated_by: null,
  deleted_at: null,
  customer: null,
  vehicle: {
    id: "v1",
    plate_number: "ABC 1234",
  } as WorkOrderDetail["vehicle"],
  mechanic: null,
  helpers: [],
  services: [],
  parts: [],
  status_history: [],
  service_history: [],
  nuat_enabled: false,
};

const onRefresh = vi.fn();
const onOpenChange = vi.fn();

function renderDrawer(props?: Partial<WorkOrderDetailDrawerProps>) {
  return render(
    <WorkOrderDetailDrawer
      workOrderId="wo-1"
      open
      onOpenChange={onOpenChange}
      onRefresh={onRefresh}
      branchFilter="b1"
      assignMechanicMutation={
        props?.assignMechanicMutation ?? {
          mutateAsync: vi.fn().mockResolvedValue(undefined),
        }
      }
      assignCustomerMutation={
        props?.assignCustomerMutation ?? {
          mutateAsync: vi.fn().mockResolvedValue(undefined),
        }
      }
      {...props}
    />,
  );
}

describe("WorkOrderDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queriesMock.wo = null;
    queriesMock.error = null;
    queriesMock.isLoading = false;
    queriesMock.mechanics = [];
    mutationsMock.confirmStatus = null;
    mutationsMock.statusNotes = "";
    mutationsMock.showUnsavedWarning = false;
    mutationsMock.canCancel = false;
    mutationsMock.canInvoice = false;
    mutationsMock.handleOpenChange.mockImplementation(() => {});
    queriesMock.setWo.mockReset();
    postServiceMock.savePostServiceData.mockResolvedValue(undefined);
    paymentHelpersMock.createInvoiceAndRecordPayment.mockResolvedValue(
      undefined,
    );
    orgMutationMocks.results.length = 0;
  });

  it("renders nothing when closed", () => {
    render(
      <WorkOrderDetailDrawer
        workOrderId="wo-1"
        open={false}
        onOpenChange={onOpenChange}
        onRefresh={onRefresh}
        branchFilter={undefined}
        assignMechanicMutation={{ mutateAsync: vi.fn() }}
        assignCustomerMutation={{ mutateAsync: vi.fn() }}
      />,
    );
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
  });

  it("renders the work order data and its status actions", () => {
    queriesMock.wo = BASE_WO;
    renderDrawer();

    expect(screen.getByTestId("detail-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("header-plate")).toHaveTextContent("ABC 1234");
    // In Progress → Mark ready + Complete actions from the real footer
    expect(
      screen.getByRole("button", { name: "markReady" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "complete" }),
    ).toBeInTheDocument();
  });

  it("completes the work order through the status mutation with the right payload", async () => {
    queriesMock.wo = BASE_WO;
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "complete" }));
    });

    await waitFor(() => {
      expect(orgMutationMocks.results[0].mutateAsync).toHaveBeenCalledWith({
        status: "Completed",
      });
    });
    expect(toastMock.success).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalled();
  });

  it("shows an error toast when completing fails", async () => {
    queriesMock.wo = BASE_WO;
    orgMutationMocks.results.length = 0;
    // The two useOrgMutation calls (complete + nuat) happen during render.
    renderDrawer();
    // Make the FIRST (complete) mutation fail.
    orgMutationMocks.results[0].mutateAsync.mockRejectedValue(
      new Error("boom"),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "complete" }));
    });

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled();
    });
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("toggles NUAT through the settings mutation", async () => {
    queriesMock.wo = BASE_WO;
    renderDrawer();

    const nuatSwitch = screen.getByRole("switch");
    await act(async () => {
      fireEvent.click(nuatSwitch);
    });

    await waitFor(() => {
      expect(orgMutationMocks.results[1].mutateAsync).toHaveBeenCalledWith({
        nuat_enabled: true,
      });
    });
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("routes the cancel action to changeStatus", async () => {
    queriesMock.wo = BASE_WO;
    mutationsMock.canCancel = true;
    mutationsMock.changeStatus.mockResolvedValue(undefined);
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    await waitFor(() => {
      expect(mutationsMock.changeStatus).toHaveBeenCalledWith("Cancelled");
    });
  });

  it("closes the drawer via the header close button", () => {
    queriesMock.wo = BASE_WO;
    const localOnOpenChange = vi.fn();
    mutationsMock.handleOpenChange.mockImplementation((next: boolean) =>
      localOnOpenChange(next),
    );

    render(
      <WorkOrderDetailDrawer
        workOrderId="wo-1"
        open
        onOpenChange={localOnOpenChange}
        onRefresh={onRefresh}
        branchFilter={undefined}
        assignMechanicMutation={{ mutateAsync: vi.fn() }}
        assignCustomerMutation={{ mutateAsync: vi.fn() }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(localOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the unsaved warning and discards through the drawer handler", () => {
    queriesMock.wo = BASE_WO;
    mutationsMock.showUnsavedWarning = true;
    renderDrawer();

    expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(mutationsMock.handleDiscard).toHaveBeenCalledTimes(1);
  });

  it("renders the error state with retry when the query fails", async () => {
    queriesMock.wo = null;
    queriesMock.error = new Error("Failed to load");
    renderDrawer();

    expect(await screen.findByText("Failed to load")).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Retry" });
    await act(async () => {
      fireEvent.click(retry);
    });
    // No crash and the error state is still present.
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("opens the ready-for-pickup form from the mark-ready action", async () => {
    queriesMock.wo = BASE_WO;
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "markReady" }));
    });

    expect(
      screen.getByRole("button", { name: "ready-submit" }),
    ).toBeInTheDocument();
  });

  it("submits the ready-for-pickup flow: saves data, updates status, refreshes", async () => {
    queriesMock.wo = BASE_WO;
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "markReady" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ready-submit" }));
    });

    await waitFor(() => {
      expect(postServiceMock.savePostServiceData).toHaveBeenCalledWith({
        workOrderId: "wo-1",
        vehicleId: "v1",
        odometerReading: 72000,
        recommendations: [],
        mechanicNotes: "Ready",
      });
    });
    // Status transitioned through the complete mutation (closures can span
    // re-renders from the local ready-form state, so find the called one)
    const calledMutation = orgMutationMocks.results.find(
      (r) => r.mutateAsync.mock.calls.length > 0,
    );
    expect(calledMutation?.mutateAsync).toHaveBeenCalledWith({
      status: "Ready for Pickup",
      notes: "Ready",
    });
    // Grand total is zero on BASE_WO → no payment recorded
    expect(
      paymentHelpersMock.createInvoiceAndRecordPayment,
    ).not.toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalled();
  });

  it("records a payment when marking ready with a balance", async () => {
    queriesMock.wo = {
      ...BASE_WO,
      services: [
        { id: "s1", final_price: 50000 },
      ] as unknown as WorkOrderDetail["services"],
    };
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "markReady" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ready-submit" }));
    });

    await waitFor(() => {
      expect(
        paymentHelpersMock.createInvoiceAndRecordPayment,
      ).toHaveBeenCalledWith("org-1", "wo-1", "cash", 0, [], null);
    });
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("warns but keeps the ready flow when payment recording fails", async () => {
    queriesMock.wo = {
      ...BASE_WO,
      services: [
        { id: "s1", final_price: 50000 },
      ] as unknown as WorkOrderDetail["services"],
    };
    paymentHelpersMock.createInvoiceAndRecordPayment.mockRejectedValueOnce(
      new Error("pay failed"),
    );
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "markReady" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ready-submit" }));
    });

    await waitFor(() => {
      expect(toastMock.warning).toHaveBeenCalled();
    });
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("reverts the optimistic status and toasts when the post-service save fails", async () => {
    queriesMock.wo = BASE_WO;
    postServiceMock.savePostServiceData.mockRejectedValueOnce(
      new Error("save failed"),
    );
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "markReady" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ready-submit" }));
    });

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Failed to save post-service data",
      );
    });
    expect(queriesMock.setWo).toHaveBeenCalledWith(BASE_WO);
  });

  it("rolls back the NUAT toggle and toasts when the update fails", async () => {
    queriesMock.wo = BASE_WO;
    renderDrawer();
    orgMutationMocks.results[1].mutateAsync.mockRejectedValue(
      new Error("boom"),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("switch"));
    });

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "НӨАТ тохиргоо шинэчлэхэд алдаа гарлаа",
      );
    });
    // Optimistic set + rollback set
    expect(queriesMock.setWo).toHaveBeenCalledTimes(2);
  });

  it("renders the status confirmation panel and confirms the cancel", async () => {
    queriesMock.wo = BASE_WO;
    mutationsMock.confirmStatus = "Cancelled";
    mutationsMock.changeStatus.mockResolvedValue(undefined);
    renderDrawer();

    expect(
      screen.getByText(/statusNotesGenericTitle\[Cancelled\]/),
    ).toBeInTheDocument();
    expect(screen.getByText("confirmCancel")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("addNotesOptional"), {
      target: { value: "Customer requested" },
    });
    expect(mutationsMock.setStatusNotes).toHaveBeenCalledWith(
      "Customer requested",
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    });
    expect(mutationsMock.changeStatus).toHaveBeenCalledWith("Cancelled");
  });

  it("closes the confirmation panel via its cancel button", () => {
    queriesMock.wo = BASE_WO;
    mutationsMock.confirmStatus = "Cancelled";
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(mutationsMock.setConfirmStatus).toHaveBeenCalledWith(null);
    expect(mutationsMock.setStatusNotes).toHaveBeenCalledWith("");
  });

  it("creates an invoice from the footer when no public token exists", async () => {
    queriesMock.wo = BASE_WO;
    mutationsMock.canInvoice = true;
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "createInvoice" }));
    });

    expect(mutationsMock.generateInvoice).toHaveBeenCalled();
  });

  it("opens the public invoice link when a token exists", () => {
    queriesMock.wo = BASE_WO;
    mutationsMock.canInvoice = true;
    mutationsMock.invoicePublicToken = "tok-1";
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderDrawer();

    fireEvent.click(screen.getAllByRole("button", { name: "invoice" })[0]);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("/invoice/tok-1"),
      "_blank",
    );
    openSpy.mockRestore();
  });

  it("routes the New-status action to Diagnosing", async () => {
    queriesMock.wo = { ...BASE_WO, status: "New" };
    mutationsMock.changeStatus.mockResolvedValue(undefined);
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "startDiagnosing" }));
    });

    expect(mutationsMock.changeStatus).toHaveBeenCalledWith("Diagnosing");
  });

  it("routes the Diagnosing-status action to In Progress", async () => {
    queriesMock.wo = { ...BASE_WO, status: "Diagnosing" };
    mutationsMock.changeStatus.mockResolvedValue(undefined);
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "startWork" }));
    });

    expect(mutationsMock.changeStatus).toHaveBeenCalledWith("In Progress");
  });

  it("completes directly from Ready for Pickup", async () => {
    queriesMock.wo = { ...BASE_WO, status: "Ready for Pickup" };
    renderDrawer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "complete" }));
    });

    await waitFor(() => {
      expect(orgMutationMocks.results[0].mutateAsync).toHaveBeenCalledWith({
        status: "Completed",
      });
    });
  });

  it("opens the add-service drawer from the initial action", () => {
    queriesMock.wo = BASE_WO;
    renderDrawer({ initialAction: "add-service" });

    expect(mutationsMock.setShowAddService).toHaveBeenCalledWith(true);
  });

  it("opens the add-part drawer from the initial action", () => {
    queriesMock.wo = BASE_WO;
    renderDrawer({ initialAction: "add-part" });

    expect(mutationsMock.setShowAddPart).toHaveBeenCalledWith(true);
  });

  it("celebrates and auto-closes when the work order becomes Completed", async () => {
    vi.useFakeTimers();
    try {
      queriesMock.wo = { ...BASE_WO, status: "In Progress" };
      const { rerender } = renderDrawer();

      queriesMock.wo = { ...BASE_WO, status: "Completed" };
      await act(async () => {
        rerender(
          <WorkOrderDetailDrawer
            workOrderId="wo-1"
            open
            onOpenChange={onOpenChange}
            onRefresh={onRefresh}
            branchFilter="b1"
            assignMechanicMutation={{ mutateAsync: vi.fn() }}
            assignCustomerMutation={{ mutateAsync: vi.fn() }}
          />,
        );
      });

      expect(screen.getByText("completedCelebration")).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
