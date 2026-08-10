import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import { render } from "@/test/test-utils";
import { CustomerDetailPanel } from "../_customer-detail-panel";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  editMutate: vi.fn(),
  deleteMutate: vi.fn(),
  setDetailVehicleId: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// Panel uses useOrgMutation for PATCH (edit) and DELETE (delete) — the
// factory inspects options.method to return the right mutation object.
vi.mock("@zuiio/query", () => ({
  useOrgMutation: (opts: { method?: string }) =>
    opts?.method === "DELETE"
      ? { mutate: mocks.deleteMutate, isPending: false }
      : { mutate: mocks.editMutate, isPending: false },
}));

vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({
    setDetailVehicleId: mocks.setDetailVehicleId,
    setDetailCustomerId: vi.fn(),
    setNewCustomerDialogOpen: vi.fn(),
  }),
}));

// Follow-ups section is a separate surface with its own data fetching —
// keep this test focused on the detail panel.
vi.mock("@/components/customers/customer-followups-section", () => ({
  CustomerFollowupsSection: () => null,
}));

// ── Fixtures ────────────────────────────────────────────────────────

type CustomerDetail = {
  id: string;
  type: "individual" | "company";
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  vehicles: {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    year: number | null;
  }[];
  work_orders?: {
    id: string;
    status: string;
    description: string | null;
    complaint: string | null;
    total: number;
    created_at: string;
  }[];
};

function makeCustomer(overrides: Partial<CustomerDetail> = {}): CustomerDetail {
  return {
    id: "cust-1",
    type: "individual",
    first_name: "Bold",
    last_name: "Bat",
    full_name: null,
    company_name: null,
    contact_person: null,
    phone: "+97699112233",
    email: "bold@example.com",
    address: "Ulaanbaatar, Bayanzurkh",
    notes: "Prefers morning appointments",
    source: null,
    created_at: "2026-01-01T00:00:00.000Z",
    vehicles: [
      {
        id: "v-1",
        plate_number: "22-1234 УБА",
        make: "Toyota",
        model: "Prius",
        year: 2018,
      },
    ],
    work_orders: [
      {
        id: "wo-1",
        status: "Completed",
        description: null,
        complaint: "Brake noise",
        total: 45000,
        created_at: "2026-07-01T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

function okResponse(data: unknown) {
  return Promise.resolve({ json: () => Promise.resolve({ data }) });
}

function errorResponse(message: string) {
  return Promise.resolve({
    json: () => Promise.resolve({ error: { message } }),
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function q(name: string): HTMLInputElement | null {
  return document.querySelector(`input[name="${name}"]`);
}

function required<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) {
    throw new Error(`expected ${name} to be present`);
  }
  return value;
}

/** Icon-only buttons (Pencil / Trash / Close) have no accessible name — locate by lucide class. */
function iconButton(lucideClass: string): HTMLButtonElement {
  const svg = document.querySelector(`svg.${lucideClass}`);
  const button = svg?.closest("button");
  if (!button) throw new Error(`icon button not found: ${lucideClass}`);
  return button as HTMLButtonElement;
}

// ── Tests ───────────────────────────────────────────────────────────

describe("CustomerDetailPanel", () => {
  let onClose: Mock;

  beforeEach(() => {
    onClose = vi.fn();
    mocks.fetchMock.mockReset();
    mocks.editMutate.mockReset();
    mocks.deleteMutate.mockReset();
    mocks.setDetailVehicleId.mockReset();
    mocks.deleteMutate.mockImplementation(
      (_arg, opts?: { onSuccess?: () => void }) => {
        opts?.onSuccess?.();
      },
    );
    vi.stubGlobal("fetch", mocks.fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderPanel() {
    return render(
      <CustomerDetailPanel
        customerId="cust-1"
        orgId="org-1"
        onClose={onClose}
      />,
    );
  }

  it("shows a loading state until the customer fetch resolves", async () => {
    const d = deferred<{ json: () => Promise<{ data: unknown }> }>();
    mocks.fetchMock.mockReturnValue(d.promise);
    renderPanel();

    expect(screen.getByText("Loading…")).toBeInTheDocument();

    await act(async () => {
      d.resolve({ json: () => Promise.resolve({ data: makeCustomer() }) });
      await d.promise;
    });
    await waitFor(() =>
      expect(screen.getByText("Bold Bat")).toBeInTheDocument(),
    );
  });

  it("renders customer contact info: name, phone, email, address and notes", async () => {
    mocks.fetchMock.mockReturnValue(okResponse(makeCustomer()));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Bold Bat")).toBeInTheDocument(),
    );
    // Phone appears in the header subtitle and the contact info row
    expect(screen.getAllByText("+97699112233").length).toBeGreaterThan(0);
    expect(screen.getByText("bold@example.com")).toBeInTheDocument();
    expect(screen.getByText("Ulaanbaatar, Bayanzurkh")).toBeInTheDocument();
    expect(
      screen.getByText("Prefers morning appointments"),
    ).toBeInTheDocument();
  });

  it("shows company name and contact person for company customers", async () => {
    mocks.fetchMock.mockReturnValue(
      okResponse(
        makeCustomer({
          type: "company",
          first_name: null,
          last_name: null,
          company_name: "Mongol LLC",
          contact_person: "D. Suren",
          phone: "+97670001122",
        }),
      ),
    );
    renderPanel();

    await waitFor(() =>
      expect(screen.getAllByText("Mongol LLC").length).toBeGreaterThan(0),
    );
    expect(screen.getByText("D. Suren")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
  });

  it("renders the vehicle list with plate and make/model/year", async () => {
    mocks.fetchMock.mockReturnValue(okResponse(makeCustomer()));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("22-1234 УБА")).toBeInTheDocument(),
    );
    expect(screen.getByText("2018 Toyota Prius")).toBeInTheDocument();
    expect(screen.getByText("Vehicles (1)")).toBeInTheDocument();
  });

  it("renders work order history with status, complaint and formatted total", async () => {
    mocks.fetchMock.mockReturnValue(okResponse(makeCustomer()));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Work Orders (1)")).toBeInTheDocument(),
    );
    expect(screen.getByText("Brake noise")).toBeInTheDocument();
    expect(screen.getByText("₮ 45,000")).toBeInTheDocument();
    expect(
      screen.getByText("common.statusLabels.completed"),
    ).toBeInTheDocument();
  });

  it("omits vehicle and work order sections when there are none", async () => {
    mocks.fetchMock.mockReturnValue(
      okResponse(makeCustomer({ vehicles: [], work_orders: [] })),
    );
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Bold Bat")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Vehicles/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Work Orders/)).not.toBeInTheDocument();
  });

  it("shows the fetch error and closes via the error state button", async () => {
    const user = userEvent.setup();
    mocks.fetchMock.mockReturnValue(errorResponse("Not found"));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Not found")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Bold Bat")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("submits edited values through the edit mutation", async () => {
    const user = userEvent.setup();
    mocks.fetchMock.mockReturnValue(okResponse(makeCustomer()));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Bold Bat")).toBeInTheDocument(),
    );
    await user.click(iconButton("lucide-pencil"));

    // Edit form opens prefilled from the customer
    const firstName = required(q("firstName"), "firstName input");
    expect(firstName).toHaveValue("Bold");
    expect(required(q("phone"), "phone input")).toHaveValue("+97699112233");

    await user.clear(firstName);
    await user.type(firstName, "Bolor");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(mocks.editMutate).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "Bolor", type: "individual" }),
    );
  });

  it("cancels edit mode without submitting", async () => {
    const user = userEvent.setup();
    mocks.fetchMock.mockReturnValue(okResponse(makeCustomer()));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Bold Bat")).toBeInTheDocument(),
    );
    await user.click(iconButton("lucide-pencil"));
    expect(q("firstName")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(q("firstName")).toBeNull();
    expect(mocks.editMutate).not.toHaveBeenCalled();
  });

  it("deletes the customer after confirmation and closes on success", async () => {
    const user = userEvent.setup();
    mocks.fetchMock.mockReturnValue(okResponse(makeCustomer()));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Bold Bat")).toBeInTheDocument(),
    );
    await user.click(iconButton("lucide-trash-2"));

    expect(screen.getAllByText("deleteConfirm").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "delete" }));

    expect(mocks.deleteMutate).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("closes the panel and routes to the vehicle detail when a vehicle row is clicked", async () => {
    const user = userEvent.setup();
    mocks.fetchMock.mockReturnValue(okResponse(makeCustomer()));
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("22-1234 УБА")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("22-1234 УБА"));

    expect(mocks.setDetailVehicleId).toHaveBeenCalledWith("v-1");
    expect(onClose).toHaveBeenCalled();
  });

  it("renders the not-found state when the API returns null data", async () => {
    mocks.fetchMock.mockReturnValue(okResponse(null));
    renderPanel();

    // A settled query with data:null is a successful empty result — the
    // panel must stop loading and show the "customer not found" state.
    // Regression: isLoadingData = loading || (!customer && !error) kept the
    // loading spinner forever and made the not-found branch dead code.
    await waitFor(() =>
      expect(screen.getByText("Customer not found")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });
});
