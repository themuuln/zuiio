import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type React from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { orgKeys } from "@/lib/queries/keys";
import SettingsPage from "../page";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useCurrentOrg: vi.fn(),
  useOrgMutation: vi.fn(),
  updateOrgMutateAsync: vi.fn(),
  replace: vi.fn(),
  setTheme: vi.fn(),
  buildFormFromOrganization: vi.fn(),
  DEFAULT_FORM: {
    invoicePrefix: "INV-",
    defaultCurrency: "MNT",
    defaultTaxRate: 10,
    nuatEnabled: false,
    ndshEnabled: false,
    ndshEmployerRate: 11.5,
    ndshEmployeeRate: 10,
    einvoiceEnabled: false,
    einvoiceApiKey: "",
    einvoiceMerchantId: "",
    einvoiceEndpoint: "",
    timezone: "Asia/Ulaanbaatar",
    dateFormat: "YYYY-MM-DD",
    language: "mn",
    brandColor: "",
  },
  setCookie: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
    useLocale: () => "mn",
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: mocks.setTheme }),
}));

vi.mock("@zuiio/branding", () => ({
  generateBrandCSS: () => "",
  resolveBrandConfig: (config: Record<string, unknown>) => config,
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: mocks.useOrgMutation,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));

vi.mock("@/lib/utils", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/utils")>("@/lib/utils");
  return { ...actual, setCookie: mocks.setCookie };
});

// Section components — render identifiable stubs so the page's section
// routing (renderSectionContent) can be asserted without their internals.
vi.mock("../_organization-card", () => ({
  OrganizationCard: ({
    orgId,
    organization,
  }: {
    orgId: string;
    organization: { name?: string };
  }) => (
    <div
      data-testid="organization-card"
      data-org-id={orgId}
      data-org-name={organization?.name ?? ""}
    />
  ),
}));

vi.mock("../_business-defaults-form", () => ({
  BusinessDefaultsForm: ({
    form,
    saving,
    error,
    successMessage,
    currentLocale,
    onSubmit,
  }: {
    form: Record<string, unknown>;
    saving: boolean;
    error: string | null;
    successMessage: string | null;
    currentLocale: string;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  }) => (
    <form data-testid="settings-form" onSubmit={onSubmit}>
      <div
        data-testid="business-defaults-form"
        data-prefix={String(form.invoicePrefix)}
        data-saving={String(saving)}
        data-error={error ?? ""}
        data-success={successMessage ?? ""}
        data-locale={currentLocale}
      />
      <button type="submit">Submit Settings</button>
    </form>
  ),
  buildFormFromOrganization: mocks.buildFormFromOrganization,
  DEFAULT_FORM: mocks.DEFAULT_FORM,
}));

vi.mock("../_appearance-customization", () => ({
  AppearanceCustomization: () => <div data-testid="appearance-customization" />,
}));

vi.mock("../_branches-section", () => ({
  BranchesSection: ({ orgId }: { orgId: string }) => (
    <div data-testid="branches-section" data-org-id={orgId} />
  ),
}));

vi.mock("../_commission-rules-section", () => ({
  CommissionRulesSection: ({ orgId }: { orgId: string }) => (
    <div data-testid="commission-rules-section" data-org-id={orgId} />
  ),
}));

vi.mock("../_pricing-rules-section", () => ({
  PricingRulesSection: () => <div data-testid="pricing-rules-section" />,
}));

vi.mock("../_payment-settings-section", () => ({
  PaymentSettingsSection: () => <div data-testid="payment-settings-section" />,
}));

vi.mock("../_diagnosis-labels-section", () => ({
  DiagnosisLabelsSection: () => <div data-testid="diagnosis-labels-section" />,
}));

vi.mock("../_telegram-section", () => ({
  TelegramSection: () => <div data-testid="telegram-section" />,
}));

vi.mock("../_facebook-section", () => ({
  FacebookSection: () => <div data-testid="facebook-section" />,
}));

vi.mock("../_vehicle-niche-form", () => ({
  VehicleNicheForm: () => <div data-testid="vehicle-niche-form" />,
}));

vi.mock("../_business-type-section", () => ({
  BusinessTypeSection: () => <div data-testid="business-type-section" />,
}));

vi.mock("../_data-sharing-form", () => ({
  DataSharingForm: () => <div data-testid="data-sharing-form" />,
}));

vi.mock("../_data-export-section", () => ({
  DataExportSection: ({ orgId }: { orgId: string }) => (
    <div data-testid="data-export-section" data-org-id={orgId} />
  ),
}));

vi.mock("../_settings-sub-sidebar", () => ({
  SettingsSubSidebar: ({
    activeSection,
    onSelect,
    organizationName,
  }: {
    activeSection: string;
    onSelect: (value: string) => void;
    organizationName: string;
  }) => (
    <div
      data-testid="settings-sub-sidebar"
      data-active={activeSection}
      data-org-name={organizationName}
    >
      <button type="button" onClick={() => onSelect("branches")}>
        Go branches
      </button>
    </div>
  ),
}));

vi.mock("../_settings-sections", () => ({
  getSettingsSections: () => [
    {
      value: "general",
      title: "General",
      description: "General settings",
      icon: () => null,
    },
    {
      value: "branches",
      title: "Branches",
      description: "Branch settings",
      icon: () => null,
    },
    {
      value: "commission",
      title: "Commission",
      description: "Commission rules",
      icon: () => null,
    },
    {
      value: "export",
      title: "Export",
      description: "Export data",
      icon: () => null,
    },
  ],
}));

// ── Fixtures ────────────────────────────────────────────────────────

const organization = {
  id: "org-1",
  name: "Org 1",
  settings: {
    invoice_prefix: "INV-2026",
    default_currency: "MNT",
    default_tax_rate: 10,
    nuat_enabled: true,
    ndsh_enabled: true,
    ndsh_employer_rate: 11.5,
    ndsh_employee_rate: 10,
    einvoice_enabled: false,
    timezone: "Asia/Ulaanbaatar",
    date_format: "YYYY-MM-DD",
    language: "mn",
    brand_color: "#0f766e",
  },
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <SettingsPage />
    </QueryClientProvider>,
  );
}

// ── Tests ───────────────────────────────────────────────────────────

describe("SettingsPage", () => {
  let mutationOptions:
    | {
        onSuccess?: (data: typeof organization) => void;
        onError?: (err: Error) => void;
      }
    | undefined;

  beforeAll(() => {
    if (!("IntersectionObserver" in globalThis)) {
      class IntersectionObserverStub implements IntersectionObserver {
        readonly root = null;
        readonly rootMargin = "";
        readonly thresholds = [];
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      }
      Object.defineProperty(globalThis, "IntersectionObserver", {
        writable: true,
        value: IntersectionObserverStub,
      });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mutationOptions = undefined;
    mocks.useCurrentOrg.mockReturnValue({
      data: { orgId: "org-1", orgName: "Org 1", branchId: null },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
    mocks.buildFormFromOrganization.mockImplementation(
      (org: { settings?: Record<string, unknown> } | null) => ({
        ...mocks.DEFAULT_FORM,
        invoicePrefix:
          org?.settings?.invoice_prefix ?? mocks.DEFAULT_FORM.invoicePrefix,
        defaultCurrency:
          org?.settings?.default_currency ?? mocks.DEFAULT_FORM.defaultCurrency,
        defaultTaxRate:
          org?.settings?.default_tax_rate ?? mocks.DEFAULT_FORM.defaultTaxRate,
        nuatEnabled:
          org?.settings?.nuat_enabled ?? mocks.DEFAULT_FORM.nuatEnabled,
        ndshEnabled:
          org?.settings?.ndsh_enabled ?? mocks.DEFAULT_FORM.ndshEnabled,
        timezone: org?.settings?.timezone ?? mocks.DEFAULT_FORM.timezone,
        dateFormat: org?.settings?.date_format ?? mocks.DEFAULT_FORM.dateFormat,
        language: org?.settings?.language ?? mocks.DEFAULT_FORM.language,
        brandColor: org?.settings?.brand_color ?? mocks.DEFAULT_FORM.brandColor,
      }),
    );
    mocks.updateOrgMutateAsync.mockResolvedValue(organization);
    mocks.useOrgMutation.mockImplementation(
      (opts: {
        onSuccess?: (data: typeof organization) => void;
        onError?: (err: Error) => void;
      }) => {
        mutationOptions = opts;
        return {
          mutateAsync: mocks.updateOrgMutateAsync,
          isPending: false,
          isError: false,
          error: null,
        };
      },
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("shows skeletons while the org is loading", () => {
    mocks.useCurrentOrg.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByTestId("business-defaults-form"),
    ).not.toBeInTheDocument();
  });

  it("shows the error state with the org error and retries", async () => {
    const refetch = vi.fn();
    mocks.useCurrentOrg.mockReturnValue({
      data: null,
      isPending: false,
      error: new Error("org fetch failed"),
      refetch,
    });
    renderPage();

    expect(screen.getByText("settings.failedToLoad")).toBeInTheDocument();
    expect(screen.getByText("org fetch failed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("common.retry"));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows the no-organization error state when the org detail is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    expect(await screen.findByText("noOrganization")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("renders every settings section with the org data", async () => {
    queryClient.setQueryData(orgKeys.detail("org-1"), organization);
    renderPage();

    // "General" appears in the section heading and the header badge
    expect((await screen.findAllByText("General")).length).toBeGreaterThan(0);
    expect(screen.getByText("Branches")).toBeInTheDocument();
    expect(screen.getByText("Commission")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();

    // Section content is routed to the right components with orgId
    expect(screen.getByTestId("organization-card")).toHaveAttribute(
      "data-org-id",
      "org-1",
    );
    expect(screen.getByTestId("branches-section")).toHaveAttribute(
      "data-org-id",
      "org-1",
    );
    expect(screen.getByTestId("commission-rules-section")).toHaveAttribute(
      "data-org-id",
      "org-1",
    );
    expect(screen.getByTestId("data-export-section")).toHaveAttribute(
      "data-org-id",
      "org-1",
    );

    // Form state synced from the organization
    expect(screen.getByTestId("business-defaults-form")).toHaveAttribute(
      "data-prefix",
      "INV-2026",
    );
  });

  it("filters sections by search and restores them on clear", async () => {
    queryClient.setQueryData(orgKeys.detail("org-1"), organization);
    renderPage();
    await screen.findAllByText("General");

    fireEvent.change(screen.getByPlaceholderText("searchPlaceholder"), {
      target: { value: "comm" },
    });
    // "Commission" appears in the heading and the header badge
    expect(screen.getAllByText("Commission").length).toBeGreaterThan(0);
    expect(screen.queryByText("Branches")).not.toBeInTheDocument();
    expect(screen.queryByText("Export")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("searchPlaceholder"), {
      target: { value: "" },
    });
    expect(screen.getByText("Branches")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("shows the empty search state with a clear action", async () => {
    queryClient.setQueryData(orgKeys.detail("org-1"), organization);
    renderPage();
    await screen.findAllByText("General");

    fireEvent.change(screen.getByPlaceholderText("searchPlaceholder"), {
      target: { value: "zzzzz" },
    });
    expect(screen.getByText("noMatchSearch")).toBeInTheDocument();

    fireEvent.click(screen.getByText("clearSearch"));
    expect(screen.getAllByText("General").length).toBeGreaterThan(0);
  });

  it("submits the settings form with the org settings payload", async () => {
    queryClient.setQueryData(orgKeys.detail("org-1"), organization);
    renderPage();
    await screen.findAllByText("General");

    fireEvent.submit(screen.getByTestId("settings-form"));

    await waitFor(() =>
      expect(mocks.updateOrgMutateAsync).toHaveBeenCalledTimes(1),
    );
    expect(mocks.updateOrgMutateAsync).toHaveBeenCalledWith({
      settings: expect.objectContaining({
        invoice_prefix: "INV-2026",
        default_currency: "MNT",
        default_tax_rate: 10,
        nuat_enabled: true,
        ndsh_enabled: true,
        timezone: "Asia/Ulaanbaatar",
        date_format: "YYYY-MM-DD",
        language: "mn",
        brand_color: "#0f766e",
      }),
    });

    await waitFor(() =>
      expect(screen.getByTestId("business-defaults-form")).toHaveAttribute(
        "data-success",
        "saved",
      ),
    );
  });

  it("shows the error message when the save fails", async () => {
    queryClient.setQueryData(orgKeys.detail("org-1"), organization);
    mocks.updateOrgMutateAsync.mockRejectedValue(new Error("save boom"));
    renderPage();
    await screen.findAllByText("General");

    fireEvent.submit(screen.getByTestId("settings-form"));

    await waitFor(() =>
      expect(screen.getByTestId("business-defaults-form")).toHaveAttribute(
        "data-error",
        "save boom",
      ),
    );
  });

  it("re-syncs the form from the updated organization on save success", async () => {
    queryClient.setQueryData(orgKeys.detail("org-1"), organization);
    renderPage();
    await screen.findAllByText("General");

    fireEvent.submit(screen.getByTestId("settings-form"));
    await waitFor(() =>
      expect(mocks.updateOrgMutateAsync).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      mutationOptions?.onSuccess?.({
        ...organization,
        settings: { ...organization.settings, invoice_prefix: "NEW-" },
      });
    });

    await waitFor(() =>
      expect(screen.getByTestId("business-defaults-form")).toHaveAttribute(
        "data-prefix",
        "NEW-",
      ),
    );
  });

  it("selects a section from the sub sidebar", async () => {
    queryClient.setQueryData(orgKeys.detail("org-1"), organization);
    renderPage();
    await screen.findAllByText("General");

    fireEvent.click(screen.getByText("Go branches"));
    expect(screen.getByTestId("settings-sub-sidebar")).toHaveAttribute(
      "data-active",
      "branches",
    );
  });
});
