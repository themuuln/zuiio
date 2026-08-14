import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PartsCarDetailDrawer } from "@/components/inventory/parts-car-detail-drawer";
import { reportServerError } from "@/lib/sentry-report-server";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockOrgQuery = vi.fn();
const mockUsePartsCar = vi.fn();
const mockUsePartsCarParts = vi.fn();
const mockUseStartDisassembly = vi.fn();
const mockUseCompleteDisassembly = vi.fn();
const mockUseAddPartsCarPart = vi.fn();
const mockUseRemovePartsCarPart = vi.fn();
const mockUsePublishPartsCarToCatalog = vi.fn();
const mockUsePartsCatalog = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  usePartsCar: (...args: unknown[]) => mockUsePartsCar(...args),
  usePartsCarParts: (...args: unknown[]) => mockUsePartsCarParts(...args),
  useStartDisassembly: (...args: unknown[]) => mockUseStartDisassembly(...args),
  useCompleteDisassembly: (...args: unknown[]) =>
    mockUseCompleteDisassembly(...args),
  useAddPartsCarPart: (...args: unknown[]) => mockUseAddPartsCarPart(...args),
  useRemovePartsCarPart: (...args: unknown[]) =>
    mockUseRemovePartsCarPart(...args),
  usePublishPartsCarToCatalog: (...args: unknown[]) =>
    mockUsePublishPartsCarToCatalog(...args),
  usePartsCatalog: (...args: unknown[]) => mockUsePartsCatalog(...args),
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

const car = {
  id: "car-1",
  make: "Toyota",
  model: "Camry",
  year: 2018,
  purchase_cost: 10_000_000,
  status: "arrived",
};

const part = {
  id: "cp-1",
  name: "Starter",
  part_id: null,
  location_group: "other",
  quantity: 1,
  estimated_price: 50_000,
  condition: "good",
};

function renderDrawer(
  overrides: {
    car?: typeof car | null;
    parts?: (typeof part)[];
    carLoading?: boolean;
  } = {},
) {
  const queryClient = createTestQueryClient();
  if (overrides.car !== undefined || overrides.carLoading !== undefined) {
    mockUsePartsCar.mockReturnValue({
      data: overrides.car ?? car,
      isLoading: overrides.carLoading ?? false,
    });
  }
  if (overrides.parts !== undefined) {
    mockUsePartsCarParts.mockReturnValue({
      data: overrides.parts,
      isLoading: false,
    });
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <PartsCarDetailDrawer open={true} onOpenChange={vi.fn()} carId="car-1" />
    </QueryClientProvider>,
  );
}

function addPartNameInput(): HTMLInputElement {
  const input = document.querySelector('form input[data-slot="input"]');
  if (!input) throw new Error("Expected part name input in DOM");
  return input as HTMLInputElement;
}

describe("PartsCarDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "org-1" },
      isPending: false,
    });
    mockUsePartsCar.mockReturnValue({ data: car, isLoading: false });
    mockUsePartsCarParts.mockReturnValue({ data: [], isLoading: false });
    mockUsePartsCatalog.mockReturnValue({ data: [] });
    mockUseStartDisassembly.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "car-1" }),
      isPending: false,
    });
    mockUseCompleteDisassembly.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "car-1" }),
      isPending: false,
    });
    mockUseAddPartsCarPart.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "cp-9" }),
      isPending: false,
    });
    mockUseRemovePartsCarPart.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(null),
      isPending: false,
    });
    mockUsePublishPartsCarToCatalog.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        publishedCount: 2,
        catalogIds: ["cat-1", "cat-2"],
      }),
      isPending: false,
    });
  });

  it("renders the car title and status badge", () => {
    renderDrawer();
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText("status.arrived")).toBeInTheDocument();
  });

  it("shows loading spinner while car is loading", () => {
    renderDrawer({ car: undefined, carLoading: true });
    // Drawer content renders in a portal (document.body)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows not-found state and closes when car is missing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const queryClient = createTestQueryClient();
    mockUsePartsCar.mockReturnValue({ data: null, isLoading: false });
    render(
      <QueryClientProvider client={queryClient}>
        <PartsCarDetailDrawer
          open={true}
          onOpenChange={onOpenChange}
          carId="missing"
        />
      </QueryClientProvider>,
    );

    // "notFound" appears in both the title and the body
    expect(screen.getAllByText("notFound").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("starts disassembly for arrived cars", async () => {
    const user = userEvent.setup();
    const startMutate = vi.fn().mockResolvedValue({ id: "car-1" });
    mockUseStartDisassembly.mockReturnValue({
      mutateAsync: startMutate,
      isPending: false,
    });
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /startDisassembly/ }));
    await waitFor(() => {
      expect(startMutate).toHaveBeenCalledWith("car-1");
    });
    expect(toast.success).toHaveBeenCalledWith("toast.started");
  });

  it("shows error toast when starting disassembly fails", async () => {
    const user = userEvent.setup();
    const startMutate = vi.fn().mockRejectedValue(new Error("Cannot start"));
    mockUseStartDisassembly.mockReturnValue({
      mutateAsync: startMutate,
      isPending: false,
    });
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /startDisassembly/ }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Cannot start");
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });

  it("completes disassembly for cars in progress with parts", async () => {
    const user = userEvent.setup();
    const completeMutate = vi.fn().mockResolvedValue({ id: "car-1" });
    mockUseCompleteDisassembly.mockReturnValue({
      mutateAsync: completeMutate,
      isPending: false,
    });
    renderDrawer({ car: { ...car, status: "disassembling" }, parts: [part] });

    await user.click(
      screen.getByRole("button", { name: /completeDisassembly/ }),
    );
    await waitFor(() => {
      expect(completeMutate).toHaveBeenCalledWith("car-1");
    });
  });

  it("disables complete button when no parts were added", () => {
    renderDrawer({ car: { ...car, status: "disassembling" }, parts: [] });
    expect(
      screen.getByRole("button", { name: /completeDisassembly/ }),
    ).toBeDisabled();
  });

  it("adds a part with the correct payload", async () => {
    const user = userEvent.setup();
    const addMutate = vi.fn().mockResolvedValue({ id: "cp-9" });
    mockUseAddPartsCarPart.mockReturnValue({
      mutateAsync: addMutate,
      isPending: false,
    });
    renderDrawer({ car: { ...car, status: "disassembling" }, parts: [] });

    await user.type(addPartNameInput(), "Starter Motor");
    const submitButton = document.querySelector(
      'form button[type="submit"]',
    ) as HTMLButtonElement | null;
    await user.click(required(submitButton, "add part submit button"));

    await waitFor(() => {
      expect(addMutate).toHaveBeenCalledWith({
        carId: "car-1",
        name: "Starter Motor",
        part_id: undefined,
        location_group: "other",
        quantity: 1,
        condition: "good",
        estimated_price: 0,
      });
    });
  });

  it("removes a part from the car", async () => {
    const user = userEvent.setup();
    const removeMutate = vi.fn().mockResolvedValue(null);
    mockUseRemovePartsCarPart.mockReturnValue({
      mutateAsync: removeMutate,
      isPending: false,
    });
    renderDrawer({ car: { ...car, status: "disassembling" }, parts: [part] });

    expect(screen.getByText("Starter")).toBeInTheDocument();
    const removeButton = document.querySelector("button.text-destructive");
    await user.click(required(removeButton, "remove part button"));

    await waitFor(() => {
      expect(removeMutate).toHaveBeenCalledWith({
        carId: "car-1",
        partId: "cp-1",
      });
    });
  });

  it("shows in-catalog badge for parts linked to the catalog", () => {
    renderDrawer({
      car: { ...car, status: "disassembling" },
      parts: [{ ...part, part_id: "cat-1" }],
    });
    expect(screen.getByText("inCatalog")).toBeInTheDocument();
  });

  it("publishes unpublished parts to the catalog", async () => {
    const user = userEvent.setup();
    const publishMutate = vi.fn().mockResolvedValue({
      publishedCount: 2,
      catalogIds: ["cat-1", "cat-2"],
    });
    mockUsePublishPartsCarToCatalog.mockReturnValue({
      mutateAsync: publishMutate,
      isPending: false,
    });
    renderDrawer({ car: { ...car, status: "completed" }, parts: [part] });

    await user.click(screen.getByRole("button", { name: /publishToCatalog/ }));
    await waitFor(() => {
      expect(publishMutate).toHaveBeenCalledWith("car-1");
    });
    expect(toast.success).toHaveBeenCalledWith("toast.published");
  });

  it("hides publish button when all parts are already in the catalog", () => {
    renderDrawer({
      car: { ...car, status: "completed" },
      parts: [{ ...part, part_id: "cat-1" }],
    });
    expect(
      screen.queryByRole("button", { name: /publishToCatalog/ }),
    ).not.toBeInTheDocument();
  });

  it("shows profitability summary values", () => {
    renderDrawer({
      car: { ...car, status: "disassembling" },
      parts: [part],
    });
    // partCount, totalValue and profit cards
    expect(screen.getByText("fields.partCount")).toBeInTheDocument();
    expect(screen.getByText("fields.totalValue")).toBeInTheDocument();
    expect(screen.getByText("fields.profit")).toBeInTheDocument();
  });
});

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} element in DOM`);
  return value;
}
