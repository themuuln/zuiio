import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickStockInDialog } from "@/components/inventory/quick-stock-in-dialog";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    return (key: string) => key;
  },
}));

const mockMutateAsync = vi.fn();
const mockPending = { current: false };

vi.mock("@zuiio/query", async () => {
  const actual =
    await vi.importActual<typeof import("@zuiio/query")>("@zuiio/query");
  return {
    ...actual,
    useOrgMutation: (config: {
      onSuccess?: () => void;
      [key: string]: unknown;
    }) => {
      const mutateAsync = async (...args: unknown[]) => {
        const result = await mockMutateAsync(...args);
        if (config.onSuccess) config.onSuccess();
        return result;
      };
      return {
        mutateAsync,
        get isPending() {
          return mockPending.current;
        },
      };
    },
  };
});

vi.mock("sonner", () => ({
  toast: Object.assign((message: string) => ({ message }), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────

function renderDialog(props: Record<string, unknown> = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <QuickStockInDialog
        open={true}
        onOpenChange={vi.fn()}
        orgId="org-1"
        branchId={null}
        {...props}
      />
    </QueryClientProvider>,
  );
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} element in DOM`);
  return value;
}

// ── Tests ─────────────────────────────────────────────────────────

describe("QuickStockInDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: "movement-1" });
    mockPending.current = false;
  });

  describe("rendering", () => {
    it("renders dialog with title when open", () => {
      renderDialog();
      expect(screen.getByText(/quickStockIn/i)).toBeInTheDocument();
    });

    it("renders part ID input", () => {
      renderDialog();
      expect(screen.getByPlaceholderText(/enterPartId/i)).toBeInTheDocument();
    });

    it("renders quantity input", () => {
      renderDialog();
      const qtyInput = document.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement | null;
      expect(qtyInput).toBeInTheDocument();
    });

    it("renders add stock and cancel buttons", () => {
      renderDialog();
      expect(screen.getByText(/addStock/i)).toBeInTheDocument();
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });

    it("disables part ID input when preselectedPartId is provided", () => {
      renderDialog({ preselectedPartId: "part-pre" });
      const partInput = required(
        screen.getByPlaceholderText(/enterPartId/i),
        "partId input",
      );
      expect(partInput).toBeDisabled();
      expect((partInput as HTMLInputElement).value).toBe("part-pre");
    });
  });

  describe("interaction", () => {
    it("submit button is disabled when partId is empty", () => {
      renderDialog();
      expect(screen.getByText(/addStock/i)).toBeDisabled();
    });

    it("submit button is enabled with valid partId and quantity", async () => {
      const user = userEvent.setup();
      renderDialog();
      const partInput = required(
        screen.getByPlaceholderText(/enterPartId/i),
        "partId input",
      );
      await user.type(partInput, "part-123");

      const qtyInput = document.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement | null;
      await user.clear(required(qtyInput, "qty input"));
      await user.type(required(qtyInput, "qty input"), "10");

      await waitFor(() => {
        expect(screen.getByText(/addStock/i)).not.toBeDisabled();
      });
    });

    it("submit button is disabled while mutation is pending", () => {
      mockPending.current = true;
      renderDialog({ preselectedPartId: "part-pre" });
      expect(screen.getByText(/saving/i)).toBeDisabled();
    });

    it("calls createMovement with correct params on submit", async () => {
      const user = userEvent.setup();
      renderDialog();

      const partInput = required(
        screen.getByPlaceholderText(/enterPartId/i),
        "partId input",
      );
      await user.type(partInput, "part-123");

      const qtyInput = document.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement | null;
      await user.clear(required(qtyInput, "qty input"));
      await user.type(required(qtyInput, "qty input"), "10");

      await user.click(screen.getByText(/addStock/i));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          part_id: "part-123",
          quantity: 10,
          unit_cost: 0,
          type: "adjustment",
          notes: "Quick stock in: +10",
          branch_id: null,
        });
      });
    });

    it("calls onOpenChange(false) on cancel button click", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderDialog({ onOpenChange });

      await user.click(screen.getByText(/cancel/i));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls onOpenChange(false) on successful submit", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      mockMutateAsync.mockResolvedValue({ id: "movement-1" });
      renderDialog({ onOpenChange });

      const partInput = required(
        screen.getByPlaceholderText(/enterPartId/i),
        "partId input",
      );
      await user.type(partInput, "part-123");

      const qtyInput = document.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement | null;
      await user.clear(required(qtyInput, "qty input"));
      await user.type(required(qtyInput, "qty input"), "5");

      await user.click(screen.getByText(/addStock/i));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
