import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupplierForm } from "@/components/inventory/supplier-form";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    return (key: string) => key;
  },
}));

const mockOrgQuery = vi.fn();
const mockCreateSupplier = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  useCreateSupplier: (...args: unknown[]) => mockCreateSupplier(...args),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
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
      <SupplierForm {...props} />
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

describe("SupplierForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "test-org-1" },
      isLoading: false,
    });
    mockCreateSupplier.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "default-supplier" }),
      isPending: false,
    });
  });

  describe("rendering", () => {
    it("renders all input fields", () => {
      renderForm();
      expect(q("name")).toBeInTheDocument();
      expect(q("contactPerson")).toBeInTheDocument();
      expect(q("phone")).toBeInTheDocument();
      expect(q("email")).toBeInTheDocument();
      expect(q("address")).toBeInTheDocument();
      expect(q("taxId")).toBeInTheDocument();
      expect(q("paymentTerms")).toBeInTheDocument();
      expect(q("notes")).toBeInTheDocument();
    });

    it("renders a submit button", () => {
      renderForm();
      expect(
        screen.getByRole("button", { name: /create/i }),
      ).toBeInTheDocument();
    });

    it("shows skeleton when org is loading", () => {
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
    it("shows name error when submitting with empty name", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole("button", { name: /create/i }));
      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeInTheDocument();
      });
    });
  });

  describe("submit integration", () => {
    it("calls createSupplier with form values on valid submit", async () => {
      const mutateAsync = vi.fn().mockResolvedValue({ id: "new-1" });
      mockCreateSupplier.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      renderForm();

      await user.type(required(q("name"), "name"), "ACME Corp");
      await user.type(required(q("email"), "email"), "info@acme.com");
      // phone schema rejects empty strings - provide a valid number
      await user.type(required(q("phone"), "phone"), "99112233");
      await user.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "ACME Corp",
            email: "info@acme.com",
          }),
        );
      });
    });

    it("calls onSuccess after creation", async () => {
      const newSupplier = { id: "s-1", name: "ACME Corp" };
      const mutateAsync = vi.fn().mockResolvedValue(newSupplier);
      mockCreateSupplier.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      const onSuccess = vi.fn();
      renderForm({ onSuccess });

      await user.type(required(q("name"), "name"), "ACME Corp");
      await user.type(required(q("email"), "email"), "info@acme.com");
      // phone schema rejects empty strings - provide a valid number
      await user.type(required(q("phone"), "phone"), "99112233");
      await user.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(newSupplier);
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
