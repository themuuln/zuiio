import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import type { CompleteOrganizationLoginState } from "@/lib/actions/complete-organization-login";
import type { UserOrganizationAccessOption } from "@/lib/services/organization-access-service";
import { render } from "@/test/test-utils";
import { OrganizationSelectionForm } from "../organization-selection-form";

// ── Mocks ──────────────────────────────────────────────────────────────
vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// ── Fixtures ───────────────────────────────────────────────────────────

const ORGS: UserOrganizationAccessOption[] = [
  {
    organizationId: "org-1",
    name: "Alpha Auto",
    slug: "alpha-auto",
    branchId: null,
    roleId: null,
    isPrimary: true,
    hasBayViewPin: true,
  },
  {
    organizationId: "org-2",
    name: "Beta Garage",
    slug: "beta-garage",
    branchId: null,
    roleId: null,
    isPrimary: false,
    hasBayViewPin: false,
  },
];

const COPY = {
  title: "Choose organization",
  subtitle: "Pick where to work",
  noOrganizations: "No organizations yet",
  organizationLabel: "Organization",
  organizationPlaceholder: "No organization selected",
  pinExplanation: "Enter your 4-6 digit PIN",
  pinLabel: "PIN",
  pinPlaceholder: "••••",
  verifyHint: "Enter your PIN to continue",
  setupHint: "Choose a PIN for this organization",
  confirmPinLabel: "Confirm PIN",
  continueLabel: "Continue",
  setupLabel: "Set up PIN",
};

async function submitForm() {
  const form = document.querySelector("form");
  if (!form) throw new Error("form not found");
  await act(async () => {
    fireEvent.submit(form);
  });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("OrganizationSelectionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the org selector with all organizations and selects the primary", () => {
    const action = vi.fn(async () => ({}));
    render(
      <OrganizationSelectionForm
        organizations={ORGS}
        action={action}
        copy={COPY}
      />,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("org-1");
    expect(
      screen.getByRole("option", { name: "Alpha Auto" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Beta Garage" }),
    ).toBeInTheDocument();
    // Slug of the selected org
    expect(screen.getByText("alpha-auto")).toBeInTheDocument();
    // PIN inputs (hasBayViewPin on org-1 → no confirm field)
    expect(screen.getByLabelText(COPY.pinLabel)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(COPY.confirmPinLabel),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: COPY.continueLabel }),
    ).toBeInTheDocument();
  });

  it("submits the selected organization and PIN via form data", async () => {
    const action = vi.fn(async () => ({}));
    render(
      <OrganizationSelectionForm
        organizations={ORGS}
        action={action}
        copy={COPY}
      />,
    );

    await submitForm();

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const [, formData] = action.mock.calls[0] as [unknown, FormData];
    expect(formData.get("organizationId")).toBe("org-1");
    expect(formData.get("pin")).toBe("1234");
  });

  it("includes confirmPin when the selected org has no bay view PIN", async () => {
    const action = vi.fn(async () => ({}));
    render(
      <OrganizationSelectionForm
        organizations={ORGS}
        action={action}
        copy={COPY}
      />,
    );

    // Switch to Beta Garage (no bay view PIN)
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "org-2" },
    });
    expect(screen.getByLabelText(COPY.confirmPinLabel)).toBeInTheDocument();
    expect(screen.getByText("beta-garage")).toBeInTheDocument();

    await submitForm();

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const [, formData] = action.mock.calls[0] as [unknown, FormData];
    expect(formData.get("organizationId")).toBe("org-2");
    expect(formData.get("pin")).toBe("1234");
    expect(formData.get("confirmPin")).toBe("1234");
  });

  it("filters organizations by search query", async () => {
    const action = vi.fn(async () => ({}));
    render(
      <OrganizationSelectionForm
        organizations={ORGS}
        action={action}
        copy={COPY}
      />,
    );

    await userEvent
      .setup()
      .type(screen.getByPlaceholderText(COPY.organizationLabel), "beta");

    const options = screen
      .getAllByRole("option")
      .filter((o) => (o as HTMLOptionElement).value !== "");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Beta Garage");
  });

  it("shows a form error from the action and fires a toast", async () => {
    const action = vi.fn(async () => ({ formError: "Wrong PIN" }));
    render(
      <OrganizationSelectionForm
        organizations={ORGS}
        action={action}
        copy={COPY}
      />,
    );

    await submitForm();

    expect(await screen.findByText("Wrong PIN")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Wrong PIN");
  });

  it("shows field errors for pin and organizationId", async () => {
    const action = vi.fn(
      async () =>
        ({
          fieldErrors: { pin: "PIN is required", organizationId: "Pick one" },
        }) as CompleteOrganizationLoginState,
    );
    render(
      <OrganizationSelectionForm
        organizations={ORGS}
        action={action}
        copy={COPY}
      />,
    );

    await submitForm();

    expect(await screen.findByText("PIN is required")).toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("redirects via window.location.replace when the action returns redirectTo", async () => {
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        href: "http://localhost:3000/",
        origin: "http://localhost:3000",
        pathname: "/",
        search: "",
        hash: "",
        replace: replaceMock,
        reload: vi.fn(),
        assign: vi.fn(),
      },
    });

    try {
      const action = vi.fn(
        async () =>
          ({ redirectTo: "/dashboard" }) as CompleteOrganizationLoginState,
      );
      render(
        <OrganizationSelectionForm
          organizations={ORGS}
          action={action}
          copy={COPY}
        />,
      );

      await submitForm();

      await waitFor(() =>
        expect(replaceMock).toHaveBeenCalledWith("/dashboard"),
      );
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: originalLocation,
      });
    }
  });

  it("renders a hidden org input in single-org mode without the selector", () => {
    const action = vi.fn(async () => ({}));
    render(
      <OrganizationSelectionForm
        organizations={[ORGS[0]]}
        action={action}
        copy={COPY}
        singleOrgMode
      />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      document.querySelector<HTMLInputElement>('input[name="organizationId"]')
        ?.value,
    ).toBe("org-1");
    expect(
      screen.getByRole("button", { name: COPY.continueLabel }),
    ).toBeInTheDocument();
  });

  it("shows the empty state when there are no organizations", () => {
    const action = vi.fn(async () => ({}));
    render(
      <OrganizationSelectionForm
        organizations={[]}
        action={action}
        copy={COPY}
      />,
    );

    expect(screen.getByText(COPY.noOrganizations)).toBeInTheDocument();
    expect(document.querySelector("form")).not.toBeInTheDocument();
  });
});
