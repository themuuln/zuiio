import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/test-utils";
import { CustomerForm } from "./customer-form";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    return (key: string, params?: { fallback?: string }) => {
      return params?.fallback ?? key;
    };
  },
}));

const mockOrgQuery = vi.fn();
const mockCreateCustomer = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useCreateCustomer: (...args: unknown[]) => mockCreateCustomer(...args),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

// Mock fetch so the duplicate-check HTTP call fails fast instead of hanging
vi.stubGlobal(
  "fetch",
  vi.fn().mockRejectedValue(new Error("expected in test")),
);

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
      <CustomerForm {...props} />
    </QueryClientProvider>,
  );
}

function q(name: string): HTMLInputElement | null {
  return document.querySelector(`input[name="${name}"]`);
}

function phoneInput(): HTMLInputElement | null {
  return document.querySelector('input[placeholder="phonePlaceholder"]');
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} input in DOM`);
  return value;
}

// ── Tests ─────────────────────────────────────────────────────────

describe("CustomerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "test-org-1" },
      isLoading: false,
    });
    mockCreateCustomer.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "default-cust" }),
      isPending: false,
    });
  });

  describe("rendering", () => {
    it("renders core inputs in full mode", () => {
      renderForm({ mode: "full" });
      expect(q("firstName")).toBeInTheDocument();
      expect(q("lastName")).toBeInTheDocument();
      expect(phoneInput()).toBeInTheDocument();
      expect(q("email")).toBeInTheDocument();
      expect(q("address")).toBeInTheDocument();
    });

    it("renders mode toggle with Quick and Full Details", () => {
      renderForm({ mode: "full" });
      expect(screen.getByText("Quick")).toBeInTheDocument();
      expect(screen.getByText(/full details/i)).toBeInTheDocument();
    });

    it("renders a submit button", () => {
      renderForm({ mode: "full" });
      expect(
        screen.getByRole("button", { name: /create/i }),
      ).toBeInTheDocument();
    });
  });

  describe("validation — quick mode", () => {
    it("shows first name error when submitting empty form", async () => {
      const user = userEvent.setup();
      renderForm({ mode: "quick" });
      await user.click(screen.getByRole("button", { name: /create/i }));
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it("shows phone error when phone is empty", async () => {
      const user = userEvent.setup();
      renderForm({ mode: "quick" });
      await user.type(required(q("firstName"), "firstName"), "John");
      await user.click(screen.getByRole("button", { name: /create/i }));
      await waitFor(() => {
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument();
      });
    });
  });

  describe("validation — full mode", () => {
    it("shows name error when both first and last are empty", async () => {
      const user = userEvent.setup();
      renderForm({ mode: "full" });
      await user.click(screen.getByRole("button", { name: /create/i }));
      await waitFor(() => {
        expect(
          screen.getByText(/first or last name is required/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("initial data and input persistence", () => {
    it("pre-fills from initialData prop", () => {
      renderForm({
        mode: "full",
        initialData: { firstName: "Jane", lastName: "Doe", phone: "99112233" },
      });
      expect(q("firstName")?.value).toBe("Jane");
      expect(q("lastName")?.value).toBe("Doe");
      expect(phoneInput()?.value).toBe("99112233");
    });

    it("preserves typed values across renders", async () => {
      const user = userEvent.setup();
      renderForm({ mode: "full" });
      const first = required(q("firstName"), "firstName");
      await user.type(first, "John");
      expect(first.value).toBe("John");
      await user.type(first, "athan");
      expect(first.value).toBe("Johnathan");
      const last = required(q("lastName"), "lastName");
      await user.type(last, "Doe");
      expect(last.value).toBe("Doe");
      expect(first.value).toBe("Johnathan");
    });
  });

  describe("submit integration", () => {
    it("calls createCustomer with form values on valid submit", async () => {
      const mutateAsync = vi.fn().mockResolvedValue({ id: "new-1" });
      mockCreateCustomer.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      renderForm({ mode: "full" });

      await user.type(required(q("firstName"), "firstName"), "John");
      await user.type(required(q("lastName"), "lastName"), "Doe");
      await user.type(required(phoneInput(), "phone"), "99112233");
      await user.type(required(q("email"), "email"), "john@example.com");
      await user.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: "John",
            lastName: "Doe",
            phone: "99112233",
            email: "john@example.com",
            type: "individual",
          }),
        );
      });
    });

    it("calls onSuccess after creation", async () => {
      const newC = { id: "c-1", firstName: "John" };
      const mutateAsync = vi.fn().mockResolvedValue(newC);
      mockCreateCustomer.mockReturnValue({ mutateAsync, isPending: false });

      const user = userEvent.setup();
      const onSuccess = vi.fn();
      renderForm({ mode: "quick", onSuccess });

      await user.type(required(q("firstName"), "firstName"), "John");
      await user.type(required(phoneInput(), "phone"), "99112233");
      await user.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(newC);
      });
    });
  });
});
