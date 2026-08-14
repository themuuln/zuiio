import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReturnToSupplierDialog } from "@/components/inventory/return-to-supplier-dialog";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockMutateAsync = vi.fn();
const mockPending = { current: false };

vi.mock("@zuiio/query", () => ({
  useOrgMutation: (config: { onSuccess?: () => void }) => {
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
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

function renderDialog(
  props: {
    branchId?: string | null;
    preselectedPartId?: string;
    onOpenChange?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ReturnToSupplierDialog
        open={true}
        onOpenChange={props.onOpenChange ?? vi.fn()}
        orgId="org-1"
        branchId={props.branchId ?? null}
        preselectedPartId={props.preselectedPartId}
      />
    </QueryClientProvider>,
  );
}

function partInput(): HTMLInputElement {
  const input = screen.getByPlaceholderText("enterPartId");
  return input as HTMLInputElement;
}

function quantityInput(): HTMLInputElement {
  const input = document.querySelector('input[type="number"]');
  if (!input) throw new Error("Expected quantity input in DOM");
  return input as HTMLInputElement;
}

describe("ReturnToSupplierDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: "movement-1" });
    mockPending.current = false;
  });

  it("renders the dialog title and inputs when open", () => {
    renderDialog();
    expect(screen.getByText("returnToSupplier")).toBeInTheDocument();
    expect(partInput()).toBeInTheDocument();
    expect(screen.getByText("recordReturn")).toBeInTheDocument();
  });

  it("disables submit while partId is empty", () => {
    renderDialog();
    expect(screen.getByText("recordReturn")).toBeDisabled();
  });

  it("disables submit when quantity is zero or negative", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(partInput(), "part-1");
    await user.type(quantityInput(), "0");
    expect(screen.getByText("recordReturn")).toBeDisabled();

    fireEvent.change(quantityInput(), { target: { value: "-3" } });
    expect(screen.getByText("recordReturn")).toBeDisabled();
  });

  it("submits a return movement with the correct payload", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(partInput(), "part-1");
    await user.type(quantityInput(), "5");
    await user.click(screen.getByText("recordReturn"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        part_id: "part-1",
        quantity: 5,
        unit_cost: 0,
        type: "return",
        notes: "",
        branch_id: null,
      });
    });
  });

  it("passes branchId and includes reason, cost and notes in the payload", async () => {
    const user = userEvent.setup();
    renderDialog({ branchId: "branch-1" });

    await user.type(partInput(), "part-1");
    await user.type(quantityInput(), "3");

    // Unit cost (CurrencyInput)
    const costInput = screen.getByLabelText("Currency");
    await user.type(costInput, "1000");
    await user.tab();

    // Notes typed before opening the select (popup close can swallow keystrokes)
    await user.type(
      screen.getByPlaceholderText("optionalNotes"),
      "box damaged",
    );

    // Reason select — fireEvent bypasses jsdom pointer-events CSS limitations
    // (userEvent clicks fail inside the Base UI dialog context)
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Defective"));

    await user.click(screen.getByText("recordReturn"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        part_id: "part-1",
        quantity: 3,
        unit_cost: 1000,
        type: "return",
        notes: "Reason: Defective | box damaged",
        branch_id: "branch-1",
      });
    });
  });

  it("closes and shows success toast after a successful return", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    await user.type(partInput(), "part-1");
    await user.type(quantityInput(), "2");
    await user.click(screen.getByText("recordReturn"));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(toast.success).toHaveBeenCalledWith("returnRecorded");
  });

  it("closes when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    await user.click(screen.getByText("cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("pre-fills and disables part input when preselectedPartId is provided", () => {
    renderDialog({ preselectedPartId: "part-pre" });
    expect(partInput()).toBeDisabled();
    expect(partInput().value).toBe("part-pre");
  });
});
