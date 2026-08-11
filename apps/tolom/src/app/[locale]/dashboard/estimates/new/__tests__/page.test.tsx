import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import NewEstimatePage from "../page";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  createMutateAsync: vi.fn().mockResolvedValue({ data: { id: "est-1" } }),
  useServiceSearch: vi.fn(),
  usePartSearch: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  push: vi.fn(),
  back: vi.fn(),
  customerId: "cust-1",
  vehicleId: "veh-1",
  selectedBranchId: "all",
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@zuiio/query", () => ({
  useOrgMutation: () => ({
    mutateAsync: mocks.createMutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1", settings: { default_tax_rate: 10 } },
    isPending: false,
  }),
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => mocks.selectedBranchId,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: mocks.push, back: mocks.back }),
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
  }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/queries/use-service-search", () => ({
  useServiceSearch: mocks.useServiceSearch,
}));

vi.mock("@/lib/queries/use-part-search", () => ({
  usePartSearch: mocks.usePartSearch,
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

vi.mock("@/components/work-orders/customer-select", () => ({
  CustomerSelect: ({ onSelect }: { onSelect: (c: { id: string }) => void }) => (
    <button type="button" onClick={() => onSelect({ id: mocks.customerId })}>
      Select Customer
    </button>
  ),
}));

vi.mock("@/components/work-orders/vehicle-select", () => ({
  VehicleSelect: ({ onSelect }: { onSelect: (v: { id: string }) => void }) => (
    <button type="button" onClick={() => onSelect({ id: mocks.vehicleId })}>
      Select Vehicle
    </button>
  ),
}));

// ── Helpers ─────────────────────────────────────────────────────────

async function addCustomLine(
  user: ReturnType<typeof userEvent.setup>,
  description: string,
) {
  await user.click(screen.getByText("addCustom"));
  await user.type(
    screen.getByPlaceholderText("descriptionPlaceholder"),
    description,
  );
}

async function selectCustomerAndVehicle(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(screen.getByText("Select Customer"));
  await user.click(screen.getByText("Select Vehicle"));
}

function expectDraftPayload() {
  expect(mocks.createMutateAsync).toHaveBeenCalledTimes(1);
  const payload = mocks.createMutateAsync.mock.calls[0][0] as Record<
    string,
    unknown
  >;
  expect(payload).toMatchObject({
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    branchId: null,
    status: "draft",
    discount_amount: 0,
    discount_percentage: 0,
    tax_total: 0,
  });
  return payload;
}

// ── Tests ───────────────────────────────────────────────────────────

describe("NewEstimatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useServiceSearch.mockReturnValue({ data: [], isPending: false });
    mocks.usePartSearch.mockReturnValue({ data: [], isPending: false });
  });

  it("renders the title and the empty line-item state", () => {
    render(<NewEstimatePage />);

    expect(screen.getByText("newQuoteTitle")).toBeInTheDocument();
    expect(screen.getByText("noItemsTitle")).toBeInTheDocument();
    // description appears in the section header and the empty state
    expect(screen.getAllByText("noItemsDescription").length).toBeGreaterThan(0);
    // Zeroed summary panel
    expect(screen.getAllByText(/₮ 0/).length).toBeGreaterThan(0);
  });

  it("blocks saving when no customer is selected", async () => {
    const user = userEvent.setup();
    render(<NewEstimatePage />);

    await addCustomLine(user, "Brake pads");
    await user.click(screen.getByText("saveAsDraft"));

    expect(mocks.toast.error).toHaveBeenCalledWith("pleaseSelectCustomer");
    expect(mocks.createMutateAsync).not.toHaveBeenCalled();
  });

  it("blocks saving when no vehicle is selected", async () => {
    const user = userEvent.setup();
    render(<NewEstimatePage />);

    await user.click(screen.getByText("Select Customer"));
    await addCustomLine(user, "Brake pads");
    await user.click(screen.getByText("saveAsDraft"));

    expect(mocks.toast.error).toHaveBeenCalledWith("pleaseSelectVehicle");
    expect(mocks.createMutateAsync).not.toHaveBeenCalled();
  });

  it("blocks saving while a line item has no description", async () => {
    const user = userEvent.setup();
    render(<NewEstimatePage />);

    await selectCustomerAndVehicle(user);
    await user.click(screen.getByText("addCustom"));
    await user.click(screen.getByText("saveAsDraft"));

    expect(mocks.toast.error).toHaveBeenCalledWith("description");
    expect(mocks.createMutateAsync).not.toHaveBeenCalled();
  });

  it("submits a draft with customer, vehicle and a custom line item", async () => {
    const user = userEvent.setup();
    render(<NewEstimatePage />);

    await selectCustomerAndVehicle(user);
    await addCustomLine(user, "Brake pads");
    await user.click(screen.getByText("saveAsDraft"));

    const payload = expectDraftPayload();
    expect(payload.items).toEqual([
      {
        item_type: "custom",
        source_service_id: null,
        source_part_id: null,
        description: "Brake pads",
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        discount_percentage: 0,
        sort_order: 0,
      },
    ]);
  });

  it("adds a service from the drawer and submits it as a sent quote", async () => {
    const user = userEvent.setup();
    mocks.useServiceSearch.mockReturnValue({
      data: [{ id: "sc-1", name: "Oil Change", default_price: 50000 }],
      isPending: false,
    });
    render(<NewEstimatePage />);

    await user.click(screen.getByText("addService"));
    await user.click(screen.getByText("Oil Change"));
    expect(screen.getByText("Oil Change")).toBeInTheDocument();

    await selectCustomerAndVehicle(user);
    await user.click(screen.getByText("createQuote"));

    await waitFor(() =>
      expect(mocks.createMutateAsync).toHaveBeenCalledTimes(1),
    );
    const payload = mocks.createMutateAsync.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(payload).toMatchObject({
      status: "sent",
      branchId: null,
    });
    expect(payload.items).toEqual([
      {
        item_type: "service",
        source_service_id: "sc-1",
        source_part_id: null,
        description: "Oil Change",
        quantity: 1,
        unit_price: 50000,
        discount_amount: 0,
        discount_percentage: 0,
        sort_order: 0,
      },
    ]);
  });

  it("adds a part from the part drawer", async () => {
    const user = userEvent.setup();
    mocks.usePartSearch.mockReturnValue({
      data: [{ id: "pt-1", part_name: "Oil Filter", unit_price: 15000 }],
      isPending: false,
    });
    render(<NewEstimatePage />);

    await user.click(screen.getByText("addPart"));
    await user.click(screen.getByText("Oil Filter"));
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();

    await selectCustomerAndVehicle(user);
    await user.click(screen.getByText("saveAsDraft"));

    const payload = expectDraftPayload();
    expect(payload.items).toEqual([
      {
        item_type: "part",
        source_service_id: null,
        source_part_id: "pt-1",
        description: "Oil Filter",
        quantity: 1,
        unit_price: 15000,
        discount_amount: 0,
        discount_percentage: 0,
        sort_order: 0,
      },
    ]);
  });

  it("applies the НӨАТ tax rate to the grand total when enabled", async () => {
    const user = userEvent.setup();
    render(<NewEstimatePage />);

    await addCustomLine(user, "Service job");
    // price the line at 100,000
    const unitPriceInput = screen.getAllByRole("textbox", {
      name: /Currency/,
    })[0];
    await user.click(unitPriceInput);
    await user.keyboard("100000");
    await user.tab();

    // Toggle НӨАТ on → tax = 100000 * 10% = 10000
    await user.click(screen.getByRole("switch"));
    expect(screen.getAllByText(/₮ 110,000/).length).toBeGreaterThan(0);
  });

  it("shows a branch badge when a branch is selected", () => {
    mocks.selectedBranchId = "b-1";
    render(<NewEstimatePage />);
    expect(screen.getByText("branch")).toBeInTheDocument();
  });

  it("omits the branch badge for the all-branches view", () => {
    mocks.selectedBranchId = "all";
    render(<NewEstimatePage />);
    expect(screen.queryByText("branch")).not.toBeInTheDocument();
  });
});
