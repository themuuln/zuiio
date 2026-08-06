import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleNicheForm } from "@/app/[locale]/dashboard/settings/_vehicle-niche-form";
import { orgKeys } from "@/lib/queries/keys";
import type { CarBrand, CarModel } from "@/lib/queries/use-car-catalog";
import type { Organization } from "@/lib/types";

// ── Hoisted mocks ──────────────────────────────────────────────────────

const nicheMocks = vi.hoisted(() => {
  const mutationConfigs: Array<Record<string, unknown>> = [];
  return {
    mockBrands: vi.fn(),
    mockFetch: vi.fn(),
    mutationConfigs,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    useOrgMutation: vi.fn((config: Record<string, unknown>) => {
      mutationConfigs.push(config);
      const fireSuccess = () => {
        const message = config.successMessage as string | undefined;
        if (message) nicheMocks.toastSuccess(message);
      };
      return {
        mutate: (vars: unknown) => {
          nicheMocks.mutate(vars);
          fireSuccess();
        },
        mutateAsync: (vars: unknown) => {
          const result = nicheMocks.mutateAsync(vars);
          fireSuccess();
          return result ?? Promise.resolve(undefined);
        },
        isPending: false,
      };
    }),
  };
});

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: { fallback?: string }) =>
    params?.fallback ?? key,
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: nicheMocks.useOrgMutation,
}));

vi.mock("@/lib/queries/use-car-catalog", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/queries/use-car-catalog")
  >("@/lib/queries/use-car-catalog");
  return {
    ...actual,
    useCarBrands: () => nicheMocks.mockBrands(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => nicheMocks.toastSuccess(...args),
    error: (...args: unknown[]) => nicheMocks.toastError(...args),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// ── Fixtures ───────────────────────────────────────────────────────────

const BRANDS: CarBrand[] = [
  { id: "b1", name: "Toyota", country: "JP", is_active: true },
  { id: "b2", name: "BMW", country: "DE", is_active: true },
  { id: "b3", name: "Kia", country: "KR", is_active: true },
];

const TOYOTA_MODELS: CarModel[] = [
  {
    id: "m1",
    name: "Camry",
    body_type: null,
    fuel_type: null,
    transmission: null,
    drivetrain: null,
    year_start: 2018,
    year_end: null,
    engine_options: null,
    is_active: true,
  },
  {
    id: "m2",
    name: "Land Cruiser",
    body_type: null,
    fuel_type: null,
    transmission: null,
    drivetrain: null,
    year_start: 2015,
    year_end: 2021,
    engine_options: null,
    is_active: true,
  },
];

function makeOrg(settings: Record<string, unknown> | null): Organization {
  return {
    id: "org-1",
    name: "Test Workshop",
    settings,
  } as unknown as Organization;
}

// ── Helpers ────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderForm(organization?: Organization) {
  return render(
    <QueryClientProvider client={queryClient}>
      <VehicleNicheForm organization={organization} />
    </QueryClientProvider>,
  );
}

function brandCheckbox(name: string): HTMLElement {
  const checkbox = screen.getByRole("checkbox", { name });
  return checkbox;
}

function brandRow(name: string): HTMLElement {
  const label = screen.getByText(name);
  const row = label.closest("div")?.parentElement;
  if (!row) throw new Error(`No row for brand ${name}`);
  return row;
}

function expandButton(name: string): HTMLElement {
  const buttons = within(brandRow(name)).getAllByRole("button");
  return buttons[buttons.length - 1];
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("VehicleNicheForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nicheMocks.mutationConfigs.length = 0;
    nicheMocks.mockBrands.mockReturnValue({ data: BRANDS });
    nicheMocks.mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: TOYOTA_MODELS }),
    });
    vi.stubGlobal("fetch", nicheMocks.mockFetch);
    nicheMocks.mutateAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows skeletons while organization is loading", () => {
    const { container } = renderForm(undefined);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("initializes from org settings (enabled + preselected brand/model)", async () => {
    renderForm(
      makeOrg({
        language: "mn",
        vehicle_niche: { enabled: true, brand_ids: ["b1"], model_ids: ["m1"] },
      }),
    );

    const toggle = await screen.findByRole("switch");
    expect(toggle).toBeChecked();

    expect(brandCheckbox(/Toyota/)).toBeChecked();
    expect(brandCheckbox(/BMW/)).not.toBeChecked();

    // Summary badges reflect the selections
    expect(screen.getByText("1 brand")).toBeInTheDocument();
    expect(screen.getByText("1 model")).toBeInTheDocument();
  });

  it("reads niche settings with defaults when absent", async () => {
    renderForm(makeOrg({ language: "mn" }));

    const toggle = await screen.findByRole("switch");
    expect(toggle).not.toBeChecked();
    // Brand list is hidden until the niche is enabled
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  describe("enabled switch gates the brand section", () => {
    it("shows the brand selector when enabled and hides it when disabled", async () => {
      const user = userEvent.setup();
      renderForm(makeOrg(null));

      const toggle = await screen.findByRole("switch");
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

      await user.click(toggle);
      expect(
        screen.getByRole("checkbox", { name: /Toyota/ }),
      ).toBeInTheDocument();
      expect(screen.getByText("0 brands")).toBeInTheDocument();

      await user.click(toggle);
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  describe("brand selection", () => {
    it("toggles a brand on and off, updating the badge count", async () => {
      const user = userEvent.setup();
      renderForm(makeOrg(null));
      await user.click(await screen.findByRole("switch"));

      const toyota = brandCheckbox(/Toyota/);
      await user.click(toyota);
      expect(toyota).toBeChecked();
      expect(screen.getByText("1 brand")).toBeInTheDocument();

      await user.click(toyota);
      expect(toyota).not.toBeChecked();
      expect(screen.getByText("0 brands")).toBeInTheDocument();
    });

    it("selects all / inverts / clears brand selections", async () => {
      const user = userEvent.setup();
      renderForm(makeOrg(null));
      await user.click(await screen.findByRole("switch"));

      await user.click(screen.getByRole("button", { name: "Select all" }));
      expect(brandCheckbox(/Toyota/)).toBeChecked();
      expect(brandCheckbox(/BMW/)).toBeChecked();
      expect(brandCheckbox(/Kia/)).toBeChecked();
      expect(screen.getByText("3 brands")).toBeInTheDocument();

      // Invert → nothing selected, model_ids cleared
      await user.click(screen.getByRole("button", { name: "Invert" }));
      expect(brandCheckbox(/Toyota/)).not.toBeChecked();
      expect(brandCheckbox(/BMW/)).not.toBeChecked();
      expect(brandCheckbox(/Kia/)).not.toBeChecked();
      expect(screen.getByText("0 brands")).toBeInTheDocument();

      // Invert again → all selected
      await user.click(screen.getByRole("button", { name: "Invert" }));
      expect(brandCheckbox(/Toyota/)).toBeChecked();

      // Clear all → nothing selected
      await user.click(screen.getByRole("button", { name: "Clear all" }));
      expect(brandCheckbox(/Toyota/)).not.toBeChecked();
      expect(brandCheckbox(/BMW/)).not.toBeChecked();
      expect(brandCheckbox(/Kia/)).not.toBeChecked();
    });
  });

  describe("model selection", () => {
    it("loads models for an expanded brand and toggles individual models", async () => {
      const user = userEvent.setup();
      renderForm(
        makeOrg({
          vehicle_niche: { enabled: true, brand_ids: ["b1"], model_ids: [] },
        }),
      );

      // Expand Toyota — fetch models for b1
      await user.click(expandButton("Toyota"));
      const camry = await screen.findByRole("checkbox", { name: /Camry/ });
      expect(nicheMocks.mockFetch).toHaveBeenCalledWith(
        "/api/car-brands/b1/models",
      );

      expect(camry).not.toBeChecked();
      await user.click(camry);
      expect(camry).toBeChecked();
      // Summary badge + per-row badge both show the count
      expect(screen.getAllByText("1 model").length).toBeGreaterThan(0);

      // Unchecking removes it again
      await user.click(camry);
      expect(camry).not.toBeChecked();
      expect(screen.queryByText("1 model")).not.toBeInTheDocument();
    });

    it("selects/deselects all models for a brand via the All models checkbox", async () => {
      const user = userEvent.setup();
      renderForm(
        makeOrg({
          vehicle_niche: { enabled: true, brand_ids: ["b1"], model_ids: [] },
        }),
      );

      await user.click(expandButton("Toyota"));
      const allModels = await screen.findByRole("checkbox", {
        name: /All models/,
      });
      expect(allModels).not.toBeChecked();

      await user.click(allModels);
      expect(allModels).toBeChecked();
      expect(screen.getByRole("checkbox", { name: /Camry/ })).toBeChecked();
      expect(
        screen.getByRole("checkbox", { name: /Land Cruiser/ }),
      ).toBeChecked();
      expect(screen.getAllByText("2 models").length).toBeGreaterThan(0);

      await user.click(allModels);
      expect(allModels).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: /Camry/ })).not.toBeChecked();
    });
  });

  describe("saving", () => {
    it("merges vehicle_niche into existing settings and saves", async () => {
      const user = userEvent.setup();
      renderForm(
        makeOrg({
          language: "mn",
          invoice_prefix: "INV",
          vehicle_niche: { enabled: true, brand_ids: ["b1"], model_ids: [] },
        }),
      );
      await screen.findByRole("switch");

      // Add BMW to the selection
      await user.click(brandCheckbox(/BMW/));

      await user.click(
        screen.getByRole("button", { name: "Save niche settings" }),
      );

      await waitFor(() => {
        expect(nicheMocks.mutateAsync).toHaveBeenCalledTimes(1);
      });
      const payload = nicheMocks.mutateAsync.mock.calls[0][0] as {
        settings: Record<string, unknown>;
      };
      expect(payload.settings).toEqual({
        language: "mn",
        invoice_prefix: "INV",
        vehicle_niche: {
          enabled: true,
          brand_ids: ["b1", "b2"],
          model_ids: [],
        },
      });
      expect(nicheMocks.toastSuccess).toHaveBeenCalledWith("nicheSavedToast");
    });

    it("saves the disabled state when the niche switch is off", async () => {
      const user = userEvent.setup();
      renderForm(
        makeOrg({
          vehicle_niche: { enabled: true, brand_ids: ["b1"], model_ids: [] },
        }),
      );
      const toggle = await screen.findByRole("switch");
      await user.click(toggle); // disable

      await user.click(
        screen.getByRole("button", { name: "Save niche settings" }),
      );

      await waitFor(() => {
        expect(nicheMocks.mutateAsync).toHaveBeenCalledTimes(1);
      });
      const payload = nicheMocks.mutateAsync.mock.calls[0][0] as {
        settings: { vehicle_niche: { enabled: boolean } };
      };
      expect(payload.settings.vehicle_niche.enabled).toBe(false);
      // Selections are preserved in the payload even while disabled
      expect(payload.settings.vehicle_niche.brand_ids).toEqual(["b1"]);
    });

    it("registers the PATCH mutation with the org endpoint and cache key", async () => {
      renderForm(makeOrg({ language: "mn" }));
      await screen.findByRole("switch");

      const config = nicheMocks.mutationConfigs[0];
      expect(config.method).toBe("PATCH");
      expect((config.endpoint as () => string)()).toBe(
        "/api/organizations/org-1",
      );
      expect(config.queryKey).toEqual(orgKeys.detail("org-1"));
      expect(config.successMessage).toBe("nicheSavedToast");
    });
  });
});
