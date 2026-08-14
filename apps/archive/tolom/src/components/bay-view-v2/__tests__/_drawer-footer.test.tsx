import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { render } from "@/test/test-utils";
import { DrawerFooter } from "../_drawer-footer";

// ── InvoiceQrPopover generates a QR canvas — render children only ─────
vi.mock("../_invoice-qr-popover", () => ({
  InvoiceQrPopover: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

function makeWo(overrides: Partial<WorkOrderDetail> = {}): WorkOrderDetail {
  return {
    id: "wo-1",
    organization_id: "org-1",
    branch_id: null,
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
    queue_order: 1,
    odometer_at_service: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    subtotal: 0,
    total: 0,
    completed_at: null,
    started_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
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
  };
}

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    wo: makeWo(),
    taxRate: 0,
    nuatEnabled: false,
    onNuatToggle: vi.fn().mockResolvedValue(undefined),
    invoicePublicToken: null,
    saving: false,
    confirmStatus: null,
    statusNotes: "",
    creatingInvoice: false,
    canCancel: false,
    canInvoice: false,
    onChangeStatus: vi.fn().mockResolvedValue(undefined),
    onConfirmCancel: vi.fn(),
    onStatusNotesChange: vi.fn(),
    onMarkReady: vi.fn().mockResolvedValue(undefined),
    onComplete: vi.fn(),
    onCreateInvoice: vi.fn().mockResolvedValue(undefined),
    t: vi.fn((key: string) => key),
    ...overrides,
  };
}

describe("DrawerFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a start-diagnose action for New work orders", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<DrawerFooter {...props} />);

    const button = screen.getByRole("button", { name: /startDiagnosing/ });
    await user.click(button);
    expect(props.onChangeStatus).toHaveBeenCalledWith("Diagnosing");
  });

  it("shows start-work action for Diagnosing work orders", async () => {
    const user = userEvent.setup();
    const props = baseProps({ wo: makeWo({ status: "Diagnosing" }) });
    render(<DrawerFooter {...props} />);

    await user.click(screen.getByRole("button", { name: /startWork/ }));
    expect(props.onChangeStatus).toHaveBeenCalledWith("In Progress");
  });

  it("shows mark-ready and complete actions for In Progress work orders", async () => {
    const user = userEvent.setup();
    const props = baseProps({ wo: makeWo({ status: "In Progress" }) });
    render(<DrawerFooter {...props} />);

    await user.click(screen.getByRole("button", { name: /markReady/ }));
    expect(props.onMarkReady).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /complete/ }));
    expect(props.onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows only the complete action for Ready for Pickup work orders", () => {
    const props = baseProps({ wo: makeWo({ status: "Ready for Pickup" }) });
    render(<DrawerFooter {...props} />);

    expect(
      screen.getByRole("button", { name: /complete/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /markReady/ }),
    ).not.toBeInTheDocument();
  });

  it("disables all actions while saving", () => {
    const props = baseProps({
      wo: makeWo({ status: "In Progress" }),
      saving: true,
      canCancel: true,
      canInvoice: true,
    });
    render(<DrawerFooter {...props} />);

    expect(screen.getByRole("button", { name: /markReady/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /complete/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/ })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /createInvoice/ }),
    ).toBeDisabled();
  });

  it("computes and shows the grand total from services and parts", async () => {
    const user = userEvent.setup();
    const props = baseProps({
      wo: makeWo({
        status: "New",
        services: [
          { id: "svc-1", final_price: 30000 },
          { id: "svc-2", final_price: 20000 },
        ] as never[],
        parts: [{ id: "p-1", final_price: 25000 }] as never[],
      }),
    });
    const { container } = render(<DrawerFooter {...props} />);

    // Collapsed total button + hidden breakdown row: 30k + 20k + 25k
    expect(screen.getAllByText("₮ 75,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₮ 50,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₮ 25,000").length).toBeGreaterThan(0);

    // Expand the breakdown — the grid row becomes visible
    await user.click(screen.getAllByText("₮ 75,000")[0]);
    await waitFor(() => {
      expect(
        container.querySelector('[class*="grid-rows-\\[1fr\\]"]'),
      ).toBeInTheDocument();
    });
  });

  it("shows the discount and reduces the total to pay", () => {
    const props = baseProps({
      wo: makeWo({
        status: "New",
        services: [{ id: "svc-1", final_price: 100000 }] as never[],
        discount_total: 10000,
      }),
    });
    render(<DrawerFooter {...props} />);

    expect(screen.getByText("-₮ 10,000")).toBeInTheDocument();
    expect(screen.getAllByText("₮ 90,000").length).toBeGreaterThan(0);
  });

  it("adds VAT to the total when enabled and shows it in the breakdown", async () => {
    const user = userEvent.setup();
    const props = baseProps({
      wo: makeWo({
        status: "New",
        services: [{ id: "svc-1", final_price: 100000 }] as never[],
      }),
      nuatEnabled: true,
      taxRate: 10,
    });
    render(<DrawerFooter {...props} />);

    // 10% VAT on 100,000 — collapsed button + hidden totalToPay row
    expect(screen.getAllByText("₮ 110,000").length).toBeGreaterThan(0);
    expect(screen.getByText("vatLabel (10%)")).toBeInTheDocument();
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();
    expect(screen.getAllByText("totalToPay").length).toBeGreaterThan(0);

    // Expand the breakdown
    await user.click(screen.getAllByText("₮ 110,000")[0]);
    expect(screen.getByText("totalToPay")).toBeInTheDocument();
  });

  it("toggles VAT via the switch", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<DrawerFooter {...props} />);

    await user.click(screen.getByRole("switch"));
    expect(props.onNuatToggle).toHaveBeenCalledWith(true, expect.anything());
  });

  it("creates an invoice when canInvoice and no token exists", async () => {
    const user = userEvent.setup();
    const props = baseProps({ canInvoice: true });
    render(<DrawerFooter {...props} />);

    await user.click(screen.getByRole("button", { name: /createInvoice/ }));
    expect(props.onCreateInvoice).toHaveBeenCalledTimes(1);
  });

  it("opens the invoice URL when a public token exists", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const props = baseProps({
      canInvoice: true,
      invoicePublicToken: "tok-123",
    });
    render(<DrawerFooter {...props} />);

    await user.click(screen.getByRole("button", { name: /invoice/ }));
    expect(openSpy).toHaveBeenCalledWith(
      `${window.location.origin}/invoice/tok-123`,
      "_blank",
    );
    openSpy.mockRestore();
  });

  it("requests cancellation when the cancel action is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps({ canCancel: true });
    render(<DrawerFooter {...props} />);

    await user.click(screen.getByRole("button", { name: /cancel/ }));
    expect(props.onChangeStatus).toHaveBeenCalledWith("Cancelled");
  });

  it("confirms a pending status change with notes", async () => {
    const user = userEvent.setup();
    const props = baseProps({
      confirmStatus: "Cancelled",
      statusNotes: "Customer request",
    });
    render(<DrawerFooter {...props} />);

    // Controlled input with a static prop value — set the full value at once
    fireEvent.change(screen.getByPlaceholderText("addNotesOptional"), {
      target: { value: "Customer request extra" },
    });
    expect(props.onStatusNotesChange).toHaveBeenCalledWith(
      "Customer request extra",
    );

    await user.click(screen.getByRole("button", { name: /confirm/ }));
    expect(props.onChangeStatus).toHaveBeenCalledWith("Cancelled");
  });

  it("dismisses the confirmation via the cancel button", async () => {
    const user = userEvent.setup();
    const props = baseProps({ confirmStatus: "Cancelled" });
    render(<DrawerFooter {...props} />);

    await user.click(screen.getByRole("button", { name: /cancel/ }));
    expect(props.onConfirmCancel).toHaveBeenCalledTimes(1);
  });
});
