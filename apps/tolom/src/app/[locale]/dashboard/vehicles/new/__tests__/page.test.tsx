import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
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
import NewVehiclePage from "../page";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useCurrentOrg: vi.fn(),
  createMutateAsync: vi.fn().mockResolvedValue({ id: "veh-9" }),
  replace: vi.fn(),
  setDetailVehicleId: vi.fn(),
  reportServerError: vi.fn(),
  searchParams: new URLSearchParams(),
  fetchMock: vi.fn(),
  capturedMutationOptions: undefined as
    | {
        onSuccess?: (data: { id: string }) => void;
        onError?: (error: Error) => void;
      }
    | undefined,
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations:
      () => (key: string, values?: Record<string, string | number>) => {
        let result = key;
        if (values) {
          for (const [k, v] of Object.entries(values)) {
            result = result.replace(`{${k}}`, String(v));
          }
        }
        return result;
      },
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => mocks.searchParams,
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: (opts: {
    onSuccess?: (data: { id: string }, vars?: unknown) => void;
    onError?: (error: Error, vars?: unknown) => void;
  }) => {
    mocks.capturedMutationOptions = opts;
    return {
      mutateAsync: vi.fn().mockImplementation(async (vars: unknown) => {
        try {
          const data = await mocks.createMutateAsync(vars);
          opts?.onSuccess?.(data, vars);
          return data;
        } catch (error) {
          opts?.onError?.(error as Error, vars);
          throw error;
        }
      }),
      isPending: false,
      isError: false,
      error: null,
    };
  },
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({ setDetailVehicleId: mocks.setDetailVehicleId }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

// ── Fixtures ────────────────────────────────────────────────────────

const customer = {
  id: "cust-1",
  first_name: "Bold",
  last_name: "Bat",
  company_name: null,
  contact_person: null,
  full_name: null,
  phone: "+97699112233",
  email: "bold@example.com",
};

const preselectedCustomer = {
  id: "cust-9",
  first_name: "Sara",
  last_name: "Tuya",
  company_name: null,
  contact_person: null,
  full_name: null,
  phone: "+97688112233",
  email: "sara@example.com",
};

function okJson(data: unknown) {
  return Promise.resolve({ json: async () => ({ data }) });
}

// ── Tests ───────────────────────────────────────────────────────────

describe("NewVehiclePage", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    mocks.capturedMutationOptions = undefined;
    mocks.useCurrentOrg.mockReturnValue({
      data: { orgId: "org-1", orgName: "Org 1" },
      isPending: false,
      error: null,
    });
    fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/customers/cust-9")) {
        return okJson(preselectedCustomer);
      }
      return okJson([customer]);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows skeletons while the org is loading", () => {
    mocks.useCurrentOrg.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    });
    render(<NewVehiclePage />);
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("renders the form and loads customers for selection", async () => {
    render(<NewVehiclePage />);

    expect(await screen.findByText("addVehicle")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/customers",
    );
    expect(await screen.findByText("Bold Bat")).toBeInTheDocument();
    expect(screen.getByText("+97699112233")).toBeInTheDocument();
  });

  it("blocks the mutation with validation when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<NewVehiclePage />);
    await screen.findByText("addVehicle");

    // Select a customer first so the submit reaches the field validation
    await user.click(await screen.findByText("Bold Bat"));
    await user.click(screen.getByText("createVehicle"));

    expect(mocks.createMutateAsync).not.toHaveBeenCalled();
  });

  it("keeps validation messages visible until the user edits a field", async () => {
    const user = userEvent.setup();
    render(<NewVehiclePage />);
    await screen.findByText("addVehicle");

    await user.click(await screen.findByText("Bold Bat"));
    await user.click(screen.getByText("createVehicle"));

    expect(screen.getByText("plateRequired")).toBeInTheDocument();
    expect(screen.getByText("makeRequired")).toBeInTheDocument();
    expect(screen.getByText("modelRequired")).toBeInTheDocument();
    // Regression: the error-reset effect used to depend on [error,
    // fieldErrors] and wiped just-set errors on the next effect flush, so
    // validation messages flashed for one render and vanished.
    await waitFor(() =>
      expect(screen.getByText("plateRequired")).toBeInTheDocument(),
    );

    // Typing a field clears the errors again
    await user.type(screen.getByLabelText(/make/), "Toyota");
    expect(screen.queryByText("plateRequired")).not.toBeInTheDocument();
    expect(screen.queryByText("makeRequired")).not.toBeInTheDocument();
    expect(screen.queryByText("modelRequired")).not.toBeInTheDocument();
  });

  it("requires a customer before submitting", async () => {
    const user = userEvent.setup();
    render(<NewVehiclePage />);
    await screen.findByText("addVehicle");

    await user.type(screen.getByLabelText(/plate/), "4444УНА");
    await user.type(screen.getByLabelText(/make/), "Toyota");
    await user.type(screen.getByLabelText(/model/), "Prius");
    await user.click(screen.getByText("createVehicle"));

    expect(mocks.createMutateAsync).not.toHaveBeenCalled();
  });

  it("submits the vehicle payload for the selected customer", async () => {
    const user = userEvent.setup();
    render(<NewVehiclePage />);
    await screen.findByText("addVehicle");

    await user.click(await screen.findByText("Bold Bat"));
    await user.type(screen.getByLabelText(/plate/), "4444УНА");
    await user.type(screen.getByLabelText(/make/), "Toyota");
    await user.type(screen.getByLabelText(/model/), "Prius");
    await user.click(screen.getByText("createVehicle"));

    await waitFor(() =>
      expect(mocks.createMutateAsync).toHaveBeenCalledTimes(1),
    );
    const payload = mocks.createMutateAsync.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(payload).toMatchObject({
      customerId: "cust-1",
      make: "Toyota",
      model: "Prius",
    });
    expect(String(payload.plateNumber).replace(/\s/g, "")).toBe("4444УНА");
    expect(payload.year).toBeUndefined();
    expect(payload.odometer).toBeUndefined();
  });

  it("navigates to the vehicles list and sets the detail vehicle on success", async () => {
    const user = userEvent.setup();
    render(<NewVehiclePage />);
    await screen.findByText("addVehicle");

    await user.click(await screen.findByText("Bold Bat"));
    await user.type(screen.getByLabelText(/plate/), "4444УНА");
    await user.type(screen.getByLabelText(/make/), "Toyota");
    await user.type(screen.getByLabelText(/model/), "Prius");
    await user.click(screen.getByText("createVehicle"));

    await waitFor(() =>
      expect(mocks.createMutateAsync).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/dashboard/vehicles"),
    );
    expect(mocks.setDetailVehicleId).toHaveBeenCalledWith("veh-9");
  });

  it("does not navigate when the create mutation reports an error", async () => {
    const user = userEvent.setup();
    render(<NewVehiclePage />);
    await screen.findByText("addVehicle");

    await user.click(await screen.findByText("Bold Bat"));
    await user.type(screen.getByLabelText(/plate/), "4444УНА");
    await user.type(screen.getByLabelText(/make/), "Toyota");
    await user.type(screen.getByLabelText(/model/), "Prius");
    await user.click(screen.getByText("createVehicle"));
    await waitFor(() =>
      expect(mocks.createMutateAsync).toHaveBeenCalledTimes(1),
    );
    // The success path navigated already; the error path must not
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    mocks.replace.mockClear();
    mocks.setDetailVehicleId.mockClear();

    // The page wires useOrgMutation's onError to setError — a failure must
    // not navigate.
    await act(async () => {
      mocks.capturedMutationOptions?.onError?.(new Error("plate taken"));
    });
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.setDetailVehicleId).not.toHaveBeenCalled();
  });

  it("shows the error and does not navigate when creation fails", async () => {
    const user = userEvent.setup();
    mocks.createMutateAsync.mockRejectedValueOnce(new Error("plate taken"));
    render(<NewVehiclePage />);
    await screen.findByText("addVehicle");

    await user.click(await screen.findByText("Bold Bat"));
    await user.type(screen.getByLabelText(/plate/), "4444УНА");
    await user.type(screen.getByLabelText(/make/), "Toyota");
    await user.type(screen.getByLabelText(/model/), "Prius");
    await user.click(screen.getByText("createVehicle"));

    // The mutation's onError surfaces the failure via setError and the error
    // card persists (regression: the [error, fieldErrors]-deps effect wiped
    // it on the next flush; the uncaught rejection also crashed the handler).
    await waitFor(() =>
      expect(screen.getByText("plate taken")).toBeInTheDocument(),
    );
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.setDetailVehicleId).not.toHaveBeenCalled();
    expect(mocks.reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });

  it("auto-selects the customer passed via the customerId query param", async () => {
    mocks.searchParams = new URLSearchParams({ customerId: "cust-9" });
    render(<NewVehiclePage />);

    expect(await screen.findByText("Sara Tuya")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/customers/cust-9",
    );
    // No customer search list is shown once a customer is selected
    expect(screen.queryByText("searchCustomerHint")).not.toBeInTheDocument();
  });
});
