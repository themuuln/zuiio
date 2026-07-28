import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseOrderForm } from "@/components/inventory/purchase-order-form";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    return (key: string) => key;
  },
}));

const mockOrgQuery = vi.fn();
const mockSuppliersQuery = vi.fn();
const mockPartsQuery = vi.fn();
const mockCreatePO = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  useCreatePurchaseOrder: (...args: unknown[]) => mockCreatePO(...args),
  useSuppliers: (...args: unknown[]) => mockSuppliersQuery(...args),
  usePartsCatalog: (...args: unknown[]) => mockPartsQuery(...args),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  formatMNT: (val: number) => `₮${val.toLocaleString()}`,
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" "),
}));

vi.mock("sonner", () => ({
  toast: Object.assign((message: string) => ({ message }), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────

function renderForm(props: Record<string, unknown> = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PurchaseOrderForm {...props} />
    </QueryClientProvider>,
  );
}

function q(name: string): HTMLInputElement | null {
  return document.querySelector(`input[name="${name}"]`);
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} input in DOM`);
  return value;
}

// ── Tests ─────────────────────────────────────────────────────────

describe("PurchaseOrderForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "test-org-1" },
      isLoading: false,
      isPending: false,
    });
    mockSuppliersQuery.mockReturnValue({
      data: [
        { id: "sup-1", name: "Supplier A" },
        { id: "sup-2", name: "Supplier B" },
      ],
      isLoading: false,
    });
    mockPartsQuery.mockReturnValue({
      data: [
        { id: "part-1", name: "Oil Filter" },
        { id: "part-2", name: "Brake Pad" },
      ],
      isLoading: false,
    });
    mockCreatePO.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "default-po" }),
      isPending: false,
    });
  });

  describe("rendering", () => {
    it("renders core input fields", () => {
      renderForm();
      expect(q("orderNumber")).toBeInTheDocument();
      expect(q("notes")).toBeInTheDocument();
    });

    it("renders a submit button", () => {
      renderForm();
      expect(
        screen.getByRole("button", { name: /create/i }),
      ).toBeInTheDocument();
    });

    it("renders add item button", () => {
      renderForm();
      expect(screen.getByText(/addItem/i)).toBeInTheDocument();
    });

    it("shows no items placeholder when line items are empty", () => {
      renderForm();
      expect(screen.getByText(/noItems/i)).toBeInTheDocument();
    });

    it("shows skeleton when data is loading", () => {
      mockOrgQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isPending: true,
      });
      const { container } = renderForm();
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    });
  });

  describe("validation", () => {
    it("shows order number error when submitting with empty order number", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole("button", { name: /create/i }));
      await waitFor(() => {
        expect(
          screen.getByText("Order number is required"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("submit integration", () => {
    it("calls createPurchaseOrder with form values on valid submit", async () => {
      const mutateAsync = vi.fn().mockResolvedValue({ id: "po-1" });
      mockCreatePO.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      renderForm();

      await user.type(required(q("orderNumber"), "orderNumber"), "PO-001");
      await user.click(screen.getByText(/addItem/i));

      // Wait for the line item to appear, then fill it
      await waitFor(() => {
        expect(screen.queryByText(/noItems/i)).not.toBeInTheDocument();
      });

      // Select a part - click the line item's Select trigger (second combobox, first is supplier)
      const comboboxes = screen.getAllByRole("combobox");
      // The part selector is the last combobox (after supplier)
      await user.click(comboboxes[comboboxes.length - 1]);

      // Click the option from the portal
      await user.click(screen.getByText("Oil Filter"));

      // Set quantity directly on line item inputs
      const quantityInput = document.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement | null;
      if (quantityInput) {
        await user.clear(quantityInput);
        await user.type(quantityInput, "5");
      }

      await user.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            order_number: "PO-001",
          }),
        );
      });
    });

    it("calls onSuccess after creation", async () => {
      const newPO = { id: "po-1", order_number: "PO-001" };
      const mutateAsync = vi.fn().mockResolvedValue(newPO);
      mockCreatePO.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      const onSuccess = vi.fn();
      renderForm({ onSuccess });

      await user.type(required(q("orderNumber"), "orderNumber"), "PO-001");
      await user.click(screen.getByText(/addItem/i));

      await waitFor(() => {
        expect(screen.queryByText(/noItems/i)).not.toBeInTheDocument();
      });

      // Select a part — use fireEvent to bypass pointer-events CSS limitation in jsdom
      const comboboxes = screen.getAllByRole("combobox");
      fireEvent.click(comboboxes[comboboxes.length - 1]);
      await vi.waitFor(() => {
        expect(screen.getByText("Oil Filter")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Oil Filter"));

      await user.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(newPO);
      });
    });

    it("calls onCancel when cancel button clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      renderForm({ onCancel });

      await user.click(screen.getByText(/cancel/i));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
