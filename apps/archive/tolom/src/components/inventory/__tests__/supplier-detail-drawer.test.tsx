import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupplierDetailDrawer } from "@/components/inventory/supplier-detail-drawer";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockOrgQuery = vi.fn();
const mockUseSuppliers = vi.fn();
const mockUseSupplierParts = vi.fn();
const mockUseUpdateSupplier = vi.fn();
const mockUseRemoveSupplierPart = vi.fn();
const mockUsePartsCatalog = vi.fn();
const mockUseAddSupplierPart = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  useSuppliers: (...args: unknown[]) => mockUseSuppliers(...args),
  useSupplierParts: (...args: unknown[]) => mockUseSupplierParts(...args),
  useUpdateSupplier: (...args: unknown[]) => mockUseUpdateSupplier(...args),
  useRemoveSupplierPart: (...args: unknown[]) =>
    mockUseRemoveSupplierPart(...args),
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

const supplier = {
  id: "sup-1",
  name: "AutoParts LLC",
  contact_person: "Bold",
  phone: "99112233",
  email: "bold@example.mn",
  address: "Ulaanbaatar",
  tax_id: "1234567",
  payment_terms: "Net 30",
  notes: "Regular supplier",
};

const supplierPart = {
  id: "sp-1",
  part: { name: "Oil Filter", part_number: "OF-1" },
  supplier_part_number: "S-9",
  unit_cost: 15000,
  is_preferred: true,
};

function renderDrawer(
  props: {
    supplierId?: string | null;
    supplierParts?: (typeof supplierPart)[];
    onOpenChange?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const queryClient = createTestQueryClient();
  mockUseSuppliers.mockReturnValue({ data: [supplier], isLoading: false });
  mockUseSupplierParts.mockReturnValue({
    data: props.supplierParts ?? [supplierPart],
    isLoading: false,
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SupplierDetailDrawer
        open={true}
        onOpenChange={props.onOpenChange ?? vi.fn()}
        supplierId={props.supplierId ?? "sup-1"}
      />
    </QueryClientProvider>,
  );
}

function nameInput(): HTMLInputElement {
  return document.getElementById("sd-name") as HTMLInputElement;
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} element in DOM`);
  return value;
}

describe("SupplierDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "org-1" },
      isPending: false,
    });
    mockUseUpdateSupplier.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "sup-1" }),
      isPending: false,
    });
    mockUseRemoveSupplierPart.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    mockUsePartsCatalog.mockReturnValue({ data: [] });
    mockUseAddSupplierPart.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "sp-2" }),
      isPending: false,
    });
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  it("pre-fills the form with supplier data", async () => {
    renderDrawer();
    await waitFor(() => {
      expect(nameInput()).toHaveValue("AutoParts LLC");
    });
    expect(
      (document.getElementById("sd-contact") as HTMLInputElement).value,
    ).toBe("Bold");
    expect(
      (document.getElementById("sd-phone") as HTMLInputElement).value,
    ).toBe("99112233");
    expect(
      (document.getElementById("sd-email") as HTMLInputElement).value,
    ).toBe("bold@example.mn");
  });

  it("shows name validation error on empty submit", async () => {
    const user = userEvent.setup();
    const updateMutate = vi.fn().mockResolvedValue({ id: "sup-1" });
    mockUseUpdateSupplier.mockReturnValue({
      mutateAsync: updateMutate,
      isPending: false,
    });
    renderDrawer();
    await waitFor(() => {
      expect(nameInput()).toHaveValue("AutoParts LLC");
    });

    await user.clear(nameInput());
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("updates the supplier with the correct payload", async () => {
    const user = userEvent.setup();
    const updateMutate = vi.fn().mockResolvedValue({ id: "sup-1" });
    mockUseUpdateSupplier.mockReturnValue({
      mutateAsync: updateMutate,
      isPending: false,
    });
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });
    await waitFor(() => {
      expect(nameInput()).toHaveValue("AutoParts LLC");
    });

    await user.clear(nameInput());
    await user.type(nameInput(), "New AutoParts LLC");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(updateMutate).toHaveBeenCalledWith({
        id: "sup-1",
        body: expect.objectContaining({ name: "New AutoParts LLC" }),
      });
    });
    expect(toast.success).toHaveBeenCalledWith("supplierUpdated");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders supplier parts with preferred badge and cost", () => {
    renderDrawer();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("#OF-1")).toBeInTheDocument();
    expect(screen.getByText("Sup#: S-9")).toBeInTheDocument();
    expect(screen.getByText("Preferred")).toBeInTheDocument();
    expect(screen.getByText("₮15,000")).toBeInTheDocument();
  });

  it("removes a supplier part after confirmation", async () => {
    const user = userEvent.setup();
    const removeMutate = vi.fn().mockResolvedValue(undefined);
    mockUseRemoveSupplierPart.mockReturnValue({
      mutateAsync: removeMutate,
      isPending: false,
    });
    renderDrawer();

    const partsList = document.querySelector(".divide-y");
    const removeButton = partsList?.querySelector("button");
    await user.click(required(removeButton, "remove supplier part button"));

    await waitFor(() => {
      expect(removeMutate).toHaveBeenCalledWith({
        supplierId: "sup-1",
        id: "sp-1",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("supplierPartRemoved");
  });

  it("shows no-parts message when the supplier has no parts", () => {
    renderDrawer({ supplierParts: [] });
    expect(screen.getByText("noSupplierParts")).toBeInTheDocument();
  });

  it("opens the add-part drawer", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /supplierAddPart/ }));
    expect(
      screen.getAllByText("supplierAddPart").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("shows not-found state for an unknown supplier", () => {
    mockUseSuppliers.mockReturnValue({ data: [supplier], isLoading: false });
    renderDrawer({ supplierId: "missing" });
    expect(screen.getByText("supplierNotFound")).toBeInTheDocument();
  });

  it("closes when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });
    await waitFor(() => {
      expect(nameInput()).toHaveValue("AutoParts LLC");
    });

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
