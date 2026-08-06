import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { NewEstimateDrawer } from "../_new-estimate-drawer";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mock = vi.hoisted(() => ({
  mutate: vi.fn(),
  customerId: "cust-1",
  vehicleId: "veh-1",
}));

// ── Hook mocks ──────────────────────────────────────────────────────
vi.mock("@zuiio/query", () => ({
  useOrgMutation: () => ({
    mutate: mock.mutate,
    isPending: false,
  }),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1", settings: { default_tax_rate: 10 } },
    isPending: false,
  }),
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => "all",
}));

vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/queries/use-service-search", () => ({
  useServiceSearch: () => ({ data: [], isPending: false }),
}));

vi.mock("@/lib/queries/use-part-search", () => ({
  usePartSearch: () => ({ data: [], isPending: false }),
}));

vi.mock(import("next-intl"), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// ── Selector mocks (keep the test focused on drawer + submit) ────────
vi.mock("@/components/work-orders/customer-select", () => ({
  CustomerSelect: ({ onSelect }: { onSelect: (c: { id: string }) => void }) => (
    <button type="button" onClick={() => onSelect({ id: mock.customerId })}>
      Select Customer
    </button>
  ),
}));

vi.mock("@/components/work-orders/vehicle-select", () => ({
  VehicleSelect: ({ onSelect }: { onSelect: (v: { id: string }) => void }) => (
    <button type="button" onClick={() => onSelect({ id: mock.vehicleId })}>
      Select Vehicle
    </button>
  ),
}));

describe("NewEstimateDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the DetailDrawer compound structure (Header/Body/Footer)", () => {
    const { baseElement } = render(
      <NewEstimateDrawer open onOpenChange={vi.fn()} />,
    );

    // The panel is a DetailDrawer (data-slot on its popup surface),
    // not a raw Sheet/Dialog.
    expect(
      baseElement.querySelector('[data-slot="detail-drawer"]'),
    ).toBeInTheDocument();

    // Header compound: Title + Description
    expect(
      baseElement.querySelector('[data-slot="drawer-header"]'),
    ).toBeInTheDocument();
    expect(
      baseElement.querySelector('[data-slot="drawer-title"]'),
    ).toBeInTheDocument();
    expect(
      baseElement.querySelector('[data-slot="drawer-description"]'),
    ).toBeInTheDocument();
    expect(screen.getByText("newQuoteTitle")).toBeInTheDocument();
    expect(screen.getByText("pageDescription")).toBeInTheDocument();

    // Body content is rendered (line items section)
    expect(screen.getByText("lineItems")).toBeInTheDocument();

    // Footer with sticky save actions
    expect(
      baseElement.querySelector('[data-slot="drawer-footer"]'),
    ).toBeInTheDocument();
    expect(screen.getByText("saveAsDraft")).toBeInTheDocument();
    expect(screen.getByText("createQuote")).toBeInTheDocument();
  });

  it("submits a draft with selected customer, vehicle and line items", async () => {
    const user = userEvent.setup();
    render(<NewEstimateDrawer open onOpenChange={vi.fn()} />);

    await user.click(screen.getByText("Select Customer"));
    await user.click(screen.getByText("Select Vehicle"));
    await user.click(screen.getByText("addCustom"));

    await user.type(
      screen.getByPlaceholderText("descriptionPlaceholder"),
      "Oil change",
    );

    await user.click(screen.getByText("saveAsDraft"));

    expect(mock.mutate).toHaveBeenCalledTimes(1);
    const payload = mock.mutate.mock.calls[0][0] as {
      customer_id: string;
      vehicle_id: string;
      branchId: string | null;
      status: string;
      discount_amount: number;
      discount_percentage: number;
      tax_total: number;
      items: Array<{
        item_type: string;
        description: string;
        quantity: number;
        unit_price: number;
        sort_order: number;
      }>;
    };
    expect(payload).toMatchObject({
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      branchId: null,
      status: "draft",
      discount_amount: 0,
      discount_percentage: 0,
      tax_total: 0,
    });
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      item_type: "custom",
      description: "Oil change",
      quantity: 1,
      unit_price: 0,
      sort_order: 0,
    });
  });
});
