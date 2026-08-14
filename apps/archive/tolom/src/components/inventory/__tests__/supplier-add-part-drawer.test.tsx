import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupplierAddPartDrawer } from "@/components/inventory/supplier-add-part-drawer";
import { reportServerError } from "@/lib/sentry-report-server";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockOrgQuery = vi.fn();
const mockUsePartsCatalog = vi.fn();
const mockUseAddSupplierPart = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  usePartsCatalog: (...args: unknown[]) => mockUsePartsCatalog(...args),
  useAddSupplierPart: (...args: unknown[]) => mockUseAddSupplierPart(...args),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const parts = [
  { id: "p1", name: "Oil Filter", part_number: "OF-1" },
  { id: "p2", name: "Brake Pad", part_number: "BP-2" },
];

function renderDrawer(onOpenChange = vi.fn()) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <SupplierAddPartDrawer
        open={true}
        onOpenChange={onOpenChange}
        supplierId="sup-1"
      />
    </QueryClientProvider>,
  );
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} element in DOM`);
  return value;
}

describe("SupplierAddPartDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "org-1" },
      isPending: false,
    });
    mockUsePartsCatalog.mockReturnValue({ data: parts });
    mockUseAddSupplierPart.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "sp-1" }),
      isPending: false,
    });
  });

  it("renders the title and the parts list", () => {
    renderDrawer();
    expect(screen.getByText("supplierAddPart")).toBeInTheDocument();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("Brake Pad")).toBeInTheDocument();
  });

  it("shows no-parts message when catalog is empty", () => {
    mockUsePartsCatalog.mockReturnValue({ data: [] });
    renderDrawer();
    expect(screen.getByText("noParts")).toBeInTheDocument();
  });

  it("filters parts by search query", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const searchInput = required(
      screen.getByPlaceholderText("searchParts"),
      "search input",
    );
    await user.type(searchInput, "brake");

    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    expect(screen.getByText("Brake Pad")).toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, "zzz");
    expect(screen.getByText("noParts")).toBeInTheDocument();
  });

  it("keeps submit disabled until a part is selected", () => {
    renderDrawer();
    expect(screen.getByRole("button", { name: /addPart/ })).toBeDisabled();
  });

  it("submits the selected part with supplier details", async () => {
    const user = userEvent.setup();
    const addMutate = vi.fn().mockResolvedValue({ id: "sp-1" });
    mockUseAddSupplierPart.mockReturnValue({
      mutateAsync: addMutate,
      isPending: false,
    });
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);

    await user.click(screen.getByText("Brake Pad"));
    await user.type(
      required(
        screen.getByPlaceholderText("supplierPartNumberPlaceholder"),
        "supplier part number input",
      ),
      "S-77",
    );
    await user.type(
      required(screen.getByPlaceholderText("0.00"), "unit cost input"),
      "12.5",
    );
    await user.click(screen.getByRole("button", { name: /addPart/ }));

    await waitFor(() => {
      expect(addMutate).toHaveBeenCalledWith({
        supplierId: "sup-1",
        part_id: "p2",
        supplier_part_number: "S-77",
        unit_cost: 12.5,
      });
    });
    expect(toast.success).toHaveBeenCalledWith("supplierPartAdded");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits null supplier details when left empty", async () => {
    const user = userEvent.setup();
    const addMutate = vi.fn().mockResolvedValue({ id: "sp-1" });
    mockUseAddSupplierPart.mockReturnValue({
      mutateAsync: addMutate,
      isPending: false,
    });
    renderDrawer();

    await user.click(screen.getByText("Oil Filter"));
    await user.click(screen.getByRole("button", { name: /addPart/ }));

    await waitFor(() => {
      expect(addMutate).toHaveBeenCalledWith({
        supplierId: "sup-1",
        part_id: "p1",
        supplier_part_number: null,
        unit_cost: null,
      });
    });
  });

  it("shows error toast when adding the part fails", async () => {
    const user = userEvent.setup();
    const addMutate = vi.fn().mockRejectedValue(new Error("Add failed"));
    mockUseAddSupplierPart.mockReturnValue({
      mutateAsync: addMutate,
      isPending: false,
    });
    renderDrawer();

    await user.click(screen.getByText("Oil Filter"));
    await user.click(screen.getByRole("button", { name: /addPart/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Add failed");
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });

  it("closes when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
