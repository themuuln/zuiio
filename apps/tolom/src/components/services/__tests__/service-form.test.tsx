import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceForm } from "@/components/services/service-form";
import type { ServiceCatalog } from "@/lib/types";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockMutateAsync = vi.fn();
let mockIsPending = false;

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useCreateService: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
    mutate: vi.fn(),
    data: undefined,
    error: null,
    isSuccess: false,
    isError: false,
  }),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1", orgName: "Test Org", branchId: null },
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: true,
  }),
}));

// ── Test Data ───────────────────────────────────────────────────────────

const messages = {
  common: {
    cancel: "Cancel",
  },
  services: {
    quickAdd: "Quick Add",
    fullDetails: "Full Details",
    serviceName: "Service Name",
    namePlaceholderEn: "Service name (English)",
    nameMn: "Name (Mongolian)",
    namePlaceholderMn: "Service name (Монгол)",
    price: "Price",
    category: "Category",
    categoryPlaceholderForm: "e.g. Oil Change",
    description: "Description",
    descriptionPlaceholder: "Optional description",
    cost: "Cost",
    saving: "Saving...",
    createService: "Create Service",
    failedToSave: "Failed to save",
  },
};

// ── Tests ───────────────────────────────────────────────────────────────

describe("ServiceForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  it("renders form fields in full mode by default", () => {
    render(<ServiceForm />, { messages });

    // Tabs rendered
    expect(screen.getByText("Quick Add")).toBeInTheDocument();
    expect(screen.getByText("Full Details")).toBeInTheDocument();

    // Required basic fields
    expect(screen.getByText("Service Name")).toBeInTheDocument();
    expect(screen.getByText("Name (Mongolian)")).toBeInTheDocument();
    expect(screen.getByText(/^Price/, { exact: false })).toBeInTheDocument();

    // Full-mode fields visible by default
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText(/^Cost/, { exact: false })).toBeInTheDocument();

    // Submit button
    expect(screen.getByText("Create Service")).toBeInTheDocument();
  });

  it("shows cancel button when onCancel is provided", () => {
    render(<ServiceForm onCancel={() => {}} />, { messages });

    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("hides cancel button when onCancel is not provided", () => {
    render(<ServiceForm />, { messages });

    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("switches between quick and full mode tabs", async () => {
    const user = userEvent.setup();
    render(<ServiceForm />, { messages });

    // Start in full mode
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText(/^Cost/, { exact: false })).toBeInTheDocument();

    // Switch to quick mode
    await user.click(screen.getByText("Quick Add"));

    // Full-only fields should disappear
    expect(screen.queryByText("Category")).not.toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^Cost/, { exact: false }),
    ).not.toBeInTheDocument();

    // Basic fields should still be shown
    expect(screen.getByText("Service Name")).toBeInTheDocument();
    expect(screen.getByText("Name (Mongolian)")).toBeInTheDocument();
    expect(screen.getByText(/^Price/, { exact: false })).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ServiceForm onCancel={onCancel} />, { messages });

    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("submits form with full mode data", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockService = { id: "svc-1" } as unknown as ServiceCatalog;
    mockMutateAsync.mockResolvedValue(mockService);

    render(<ServiceForm onSuccess={onSuccess} />, { messages });

    // Fill required fields
    const nameInput = screen.getByPlaceholderText("Service name (English)");
    await user.type(nameInput, "Oil Change");

    const priceInput = screen.getByPlaceholderText("45000");
    await user.type(priceInput, "50000");

    // Submit
    await user.click(screen.getByText("Create Service"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Oil Change",
          default_price: 50000,
        }),
      );
    });
    expect(onSuccess).toHaveBeenCalledWith(mockService);
  });

  it("submits form with quick mode data (no extra fields)", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockService = { id: "svc-2" } as unknown as ServiceCatalog;
    mockMutateAsync.mockResolvedValue(mockService);

    render(<ServiceForm onSuccess={onSuccess} />, { messages });

    // Switch to quick mode
    await user.click(screen.getByText("Quick Add"));

    // Fill required fields
    const nameInput = screen.getByPlaceholderText("Service name (English)");
    await user.type(nameInput, "Quick Service");

    const priceInput = screen.getByPlaceholderText("45000");
    await user.type(priceInput, "30000");

    // Submit
    await user.click(screen.getByText("Create Service"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Quick Service",
          default_price: 30000,
        }),
      );
    });
    expect(onSuccess).toHaveBeenCalledWith(mockService);
  });

  it("shows loading/saving state while submitting", () => {
    mockMutateAsync.mockImplementation(() => new Promise(() => {}));
    mockIsPending = true;

    render(<ServiceForm />, { messages });

    // Submit button should show saving indicator since isPending is true
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("displays error when submit fails", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error("Network error"));

    render(<ServiceForm />, { messages });

    const nameInput = screen.getByPlaceholderText("Service name (English)");
    await user.type(nameInput, "Failed Service");

    const priceInput = screen.getByPlaceholderText("45000");
    await user.type(priceInput, "10000");

    await user.click(screen.getByText("Create Service"));
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("initializes with initialData", () => {
    const initialData = {
      name: "Pre-filled",
      name_mn: "Монгол нэр",
      default_price: 35000,
      default_cost: 15000,
      category: "Maintenance",
      description: "Some description",
    };

    render(<ServiceForm initialData={initialData} />, { messages });

    const nameInput = screen.getByPlaceholderText("Service name (English)");
    expect(nameInput).toHaveValue("Pre-filled");

    const nameMnInput = screen.getByPlaceholderText("Service name (Монгол)");
    expect(nameMnInput).toHaveValue("Монгол нэр");

    // Price fields use CurrencyInput which shows value differently
  });
});
