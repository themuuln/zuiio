import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PricingRulesSection } from "@/app/[locale]/dashboard/settings/_pricing-rules-section";
import { priceRuleKeys } from "@/lib/queries/keys";

// ── Hoisted mocks ──────────────────────────────────────────────────────

const queryMocks = vi.hoisted(() => {
  const mutationConfigs: Array<Record<string, unknown>> = [];
  const mutate = vi.fn();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  const toastSuccess = vi.fn();
  const toastError = vi.fn();
  return {
    mockFetchPriceRules: vi.fn(),
    mutationConfigs,
    mutate,
    mutateAsync,
    toastSuccess,
    toastError,
    useOrgMutation: vi.fn((config: Record<string, unknown>) => {
      mutationConfigs.push(config);
      // Mirror the real useOrgMutation: success toasts come from the hook
      // config's successMessage when a mutation settles successfully.
      const fireSuccess = () => {
        const message = config.successMessage as string | undefined;
        if (message) toastSuccess(message);
      };
      return {
        mutate: (vars: unknown) => {
          mutate(vars);
          fireSuccess();
        },
        mutateAsync: (vars: unknown) => {
          mutate(vars);
          fireSuccess();
          return Promise.resolve(undefined);
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
  useOrgMutation: queryMocks.useOrgMutation,
}));

vi.mock("@/lib/queries/factory", () => ({
  createOrgQuery: () => queryMocks.mockFetchPriceRules,
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => queryMocks.toastSuccess(...args),
    error: (...args: unknown[]) => queryMocks.toastError(...args),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// ── Fixtures ───────────────────────────────────────────────────────────

const LUXURY_RULE = {
  id: "r1",
  name: "Luxury parts",
  description: "Luxury vehicles pay more",
  apply_to: "part",
  conditions: { classes: ["luxury"] },
  conditions_description: "Vehicle class: luxury",
  operator: "multiply",
  value: 1.25,
  priority: 100,
  part_category: null,
  service_category: null,
  part_name_pattern: null,
  service_name_pattern: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

const OLD_CAR_RULE = {
  id: "r2",
  name: "Old cars",
  description: null,
  apply_to: "both",
  conditions: { makes: ["Toyota", "Lexus"] },
  conditions_description: "Make: Toyota, Lexus",
  operator: "add_fixed",
  value: 20000,
  priority: 50,
  part_category: null,
  service_category: null,
  part_name_pattern: null,
  service_name_pattern: null,
  is_active: false,
  created_at: "2026-01-01T00:00:00Z",
};

// ── Helpers ────────────────────────────────────────────────────────────

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PricingRulesSection orgId="org-1" />
    </QueryClientProvider>,
  );
}

function required<T>(value: T | null | undefined, name: string): T {
  if (value == null) throw new Error(`Missing ${name}`);
  return value;
}

function formElement(): HTMLFormElement {
  return required(
    document.querySelector("form") as HTMLFormElement | null,
    "drawer form",
  );
}

function submitForm() {
  fireEvent.submit(formElement());
}

/** The SettingsListItem wrapping a rule's name (name → badges div → body div → row). */
function ruleRow(name: string): HTMLElement {
  const nameEl = screen.getByText(name);
  const row = nameEl.closest("div")?.parentElement?.parentElement;
  if (!row) throw new Error(`No row for rule ${name}`);
  return row;
}

/**
 * Open a Base UI Select inside the drawer field that contains `labelText`
 * and pick `itemText`. Popup items need pointerdown + click (see
 * vehicle-form.test.tsx selectPopupItem).
 */
function selectInField(labelText: string, itemText: string) {
  const label = screen.getByText(labelText);
  const field = label.closest("[data-invalid]");
  const trigger = required(
    field?.querySelector('[data-slot="select-trigger"]') as
      | HTMLElement
      | null
      | undefined,
    `select trigger for ${labelText}`,
  );
  fireEvent.click(trigger);
  const item = screen.getByText(itemText);
  fireEvent.pointerDown(item, { pointerType: "mouse" });
  fireEvent.click(item);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("PricingRulesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMocks.mutationConfigs.length = 0;
    queryMocks.mockFetchPriceRules.mockResolvedValue([
      LUXURY_RULE,
      OLD_CAR_RULE,
    ]);
  });

  describe("list rendering", () => {
    it("shows skeletons while rules are loading", () => {
      queryMocks.mockFetchPriceRules.mockReturnValue(
        new Promise<never>(() => {}),
      );
      const { container } = renderSection();

      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
      expect(screen.queryByText("Luxury parts")).not.toBeInTheDocument();
    });

    it("renders rules sorted by priority with operator/condition info", async () => {
      renderSection();

      // Priority 50 (Old cars) sorts before priority 100 (Luxury parts)
      expect(await screen.findByText("Old cars")).toBeInTheDocument();
      // Priority 50 sorts above priority 100 in the list
      const ruleNameOrder = screen
        .getAllByText(/^(Old cars|Luxury parts)$/)
        .map((el) => el.textContent);
      expect(ruleNameOrder).toEqual(["Old cars", "Luxury parts"]);
      // Rule metadata: description, priority, operator descriptions
      expect(screen.getByText("Luxury vehicles pay more")).toBeInTheDocument();
      expect(screen.getByText("priority 50")).toBeInTheDocument();
      expect(screen.getByText("priority 100")).toBeInTheDocument();
      expect(screen.getByText("× 1.25")).toBeInTheDocument();
      // add_fixed operator formats via formatMNT (MNT currency)
      expect(screen.getByText("+ ₮ 20,000")).toBeInTheDocument();
      expect(screen.getByText("→ Vehicle class: luxury")).toBeInTheDocument();
      expect(screen.getByText("→ Make: Toyota, Lexus")).toBeInTheDocument();

      // Active/inactive badges
      expect(screen.getByText("active")).toBeInTheDocument();
      expect(screen.getByText("inactive")).toBeInTheDocument();
      // Apply-to badges: part rule → appliesParts, both → appliesBoth
      expect(screen.getByText("appliesParts")).toBeInTheDocument();
      expect(screen.getByText("appliesBoth")).toBeInTheDocument();

      // Rule count label
      expect(screen.getByText("rulesConfigured")).toBeInTheDocument();
    });

    it("renders the empty state with a create CTA when no rules exist", async () => {
      queryMocks.mockFetchPriceRules.mockResolvedValue([]);
      renderSection();

      expect(await screen.findByText("noPricingRulesYet")).toBeInTheDocument();
      expect(screen.getByText("noPricingRulesDesc")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "createFirstRule" }),
      ).toBeInTheDocument();
    });
  });

  describe("rule creation", () => {
    it("validates required fields before submitting", async () => {
      renderSection();
      await screen.findByText("Luxury parts");

      await userEvent.click(screen.getByRole("button", { name: "addRule" }));
      expect(await screen.findByText("createPriceRule")).toBeInTheDocument();

      submitForm();

      // Name is required
      expect(await screen.findByText("Name is required")).toBeInTheDocument();
      expect(queryMocks.mutate).not.toHaveBeenCalled();
    });

    it("switches the operator and shows the matching value hint", async () => {
      renderSection();
      await screen.findByText("Luxury parts");
      await userEvent.click(screen.getByRole("button", { name: "addRule" }));
      await screen.findByText("createPriceRule");

      // Default multiply hint
      expect(screen.getByText("valueMultiplyHint")).toBeInTheDocument();

      selectInField("operator", "operatorAddFixed");
      expect(screen.getByText("valueAddFixedHint")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("20000")).toBeInTheDocument();
    });

    it("requires at least one condition value for non-all condition types", async () => {
      renderSection();
      await screen.findByText("Luxury parts");
      await userEvent.click(screen.getByRole("button", { name: "addRule" }));
      await screen.findByText("createPriceRule");

      // Switch condition type to "make" (the default "class" already has
      // a value: luxury)
      selectInField("vehicleCondition", "conditionMake");
      await userEvent.type(
        screen.getByPlaceholderText("ruleNamePlaceholder"),
        "Toyota rule",
      );
      submitForm();

      expect(
        await screen.findByText(
          "At least one condition value is required for this type",
        ),
      ).toBeInTheDocument();
      expect(queryMocks.mutate).not.toHaveBeenCalled();
    });

    it("submits the form data to createPriceRule.mutate", async () => {
      renderSection();
      await screen.findByText("Luxury parts");

      await userEvent.click(screen.getByRole("button", { name: "addRule" }));
      await screen.findByText("createPriceRule");

      await userEvent.type(
        screen.getByPlaceholderText("ruleNamePlaceholder"),
        "Luxury markup",
      );
      await userEvent.type(
        screen.getByPlaceholderText("descriptionPlaceholder"),
        "High-end vehicles",
      );
      submitForm();

      await waitFor(() => {
        expect(queryMocks.mutate).toHaveBeenCalledTimes(1);
      });
      expect(queryMocks.mutate).toHaveBeenCalledWith({
        name: "Luxury markup",
        description: "High-end vehicles",
        apply_to: "both",
        conditions_type: "class",
        conditions_makes: "",
        conditions_models: "",
        conditions_classes: "luxury",
        conditions_fuel_types: "",
        conditions_body_types: "",
        conditions_description: "",
        operator: "multiply",
        value: "1.25",
        priority: "100",
        part_category: "",
        service_category: "",
        part_name_pattern: "",
        service_name_pattern: "",
      });

      // Success toast fires through the mutation config (real hook toasts
      // config.successMessage on success)
      expect(queryMocks.toastSuccess).toHaveBeenCalledWith("savePriceRule");
    });
  });

  describe("payload construction (bodyFn)", () => {
    function createConfig(): Record<string, unknown> {
      const config = queryMocks.mutationConfigs.find(
        (c) => c.method === "POST",
      );
      if (!config) throw new Error("create mutation config not registered");
      return config;
    }

    it("builds a class-conditioned payload with numeric coercion", () => {
      renderSection();
      const body = (createConfig().bodyFn as (form: unknown) => unknown)({
        name: "Luxury markup",
        description: "",
        apply_to: "part",
        conditions_type: "class",
        conditions_classes: "luxury, standard",
        conditions_makes: "",
        conditions_models: "",
        conditions_fuel_types: "",
        conditions_body_types: "",
        conditions_description: "",
        operator: "multiply",
        value: "1.25",
        priority: "100",
        part_category: "",
        service_category: "",
        part_name_pattern: "",
        service_name_pattern: "",
      });

      expect(body).toEqual({
        name: "Luxury markup",
        description: "",
        apply_to: "part",
        conditions: { classes: ["luxury", "standard"] },
        conditions_description: "Vehicle class: luxury, standard",
        operator: "multiply",
        value: 1.25,
        priority: 100,
        part_category: null,
        service_category: null,
        part_name_pattern: null,
        service_name_pattern: null,
      });
    });

    it("builds a make+model payload and honors the display description", () => {
      renderSection();
      const body = (createConfig().bodyFn as (form: unknown) => unknown)({
        name: "Toyota/Lexus",
        description: "",
        apply_to: "both",
        conditions_type: "make_model",
        conditions_makes: " Toyota, Lexus ",
        conditions_models: "Camry, RX",
        conditions_classes: "",
        conditions_fuel_types: "",
        conditions_body_types: "",
        conditions_description: "Premium Japanese",
        operator: "percentage_add",
        value: "5",
        priority: "10",
        part_category: "Engine",
        service_category: null as unknown as string,
        part_name_pattern: "",
        service_name_pattern: "",
      });

      expect(body).toEqual({
        name: "Toyota/Lexus",
        description: "",
        apply_to: "both",
        conditions: { makes: ["Toyota", "Lexus"], models: ["Camry", "RX"] },
        conditions_description: "Premium Japanese",
        operator: "percentage_add",
        value: 5,
        priority: 10,
        part_category: "Engine",
        service_category: null,
        part_name_pattern: null,
        service_name_pattern: null,
      });
    });

    it("builds an 'all vehicles' payload with empty conditions", () => {
      renderSection();
      const body = (createConfig().bodyFn as (form: unknown) => unknown)({
        name: "Flat fee",
        description: "",
        apply_to: "service",
        conditions_type: "all",
        conditions_makes: "",
        conditions_models: "",
        conditions_classes: "",
        conditions_fuel_types: "",
        conditions_body_types: "",
        conditions_description: "",
        operator: "set_fixed",
        value: "50000",
        priority: "1",
        part_category: "",
        service_category: "",
        part_name_pattern: "",
        service_name_pattern: "",
      });

      expect(body).toEqual({
        name: "Flat fee",
        description: "",
        apply_to: "service",
        conditions: {},
        conditions_description: "All vehicles",
        operator: "set_fixed",
        value: 50000,
        priority: 1,
        part_category: null,
        service_category: null,
        part_name_pattern: null,
        service_name_pattern: null,
      });
    });

    it("registers create/update/delete/toggle mutations with correct configs", () => {
      renderSection();

      const create = queryMocks.mutationConfigs.find(
        (c) => c.method === "POST",
      );
      expect(create).toMatchObject({
        endpoint: `/api/organizations/org-1/price-rules`,
        queryKey: priceRuleKeys.all("org-1"),
        successMessage: "savePriceRule",
      });

      // The component re-renders (pending → data), so each hook call may be
      // registered several times — assert the contracts, not exact counts.
      const update = queryMocks.mutationConfigs.find(
        (c) =>
          c.method === "PATCH" &&
          c.successMessage === "savePriceRule" &&
          typeof c.endpoint === "function",
      );
      expect(update).toBeDefined();
      expect(
        (update as { endpoint: (vars: { id: string }) => string }).endpoint({
          id: "r9",
        }),
      ).toBe("/api/organizations/org-1/price-rules?id=r9");

      const toggle = queryMocks.mutationConfigs.find(
        (c) =>
          c.method === "PATCH" &&
          c.successMessage === undefined &&
          typeof c.endpoint === "function",
      );
      expect(toggle).toBeDefined();
      expect(
        (toggle as { endpoint: (vars: { id: string }) => string }).endpoint({
          id: "r9",
        }),
      ).toBe("/api/organizations/org-1/price-rules?id=r9");
      expect(
        (
          toggle as { bodyFn: (vars: { is_active: boolean }) => unknown }
        ).bodyFn({
          id: "r9",
          is_active: true,
        }),
      ).toEqual({ is_active: true });

      const del = queryMocks.mutationConfigs.find((c) => c.method === "DELETE");
      expect((del as { endpoint: (id: string) => string }).endpoint("r9")).toBe(
        "/api/organizations/org-1/price-rules?id=r9",
      );
      expect(del).toMatchObject({ successMessage: "deletePriceRule" });
    });
  });

  describe("rule editing", () => {
    it("pre-fills the form and submits an update with the rule id", async () => {
      renderSection();
      await screen.findByText("Luxury parts");

      // Find the edit (pencil) button in the "Old cars" row
      const rowButtons = within(ruleRow("Old cars")).getAllByRole("button");
      const pencil = rowButtons.find(
        (b) => b.querySelector("svg") && !b.querySelector('[role="switch"]'),
      );
      await userEvent.click(required(pencil, "pencil button"));

      // Drawer opens with the rule pre-filled
      expect(await screen.findByText("editPriceRule")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("ruleNamePlaceholder")).toHaveValue(
        "Old cars",
      );
      expect(screen.getByPlaceholderText("descriptionPlaceholder")).toHaveValue(
        "",
      );

      // Condition fields are derived from conditions.makes → make type
      expect(screen.getByPlaceholderText("makesPlaceholder")).toHaveValue(
        "Toyota, Lexus",
      );

      // Change the name and submit
      const nameInput = screen.getByPlaceholderText("ruleNamePlaceholder");
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, "Legacy cars");
      submitForm();

      await waitFor(() => {
        expect(queryMocks.mutate).toHaveBeenCalledTimes(1);
      });
      const vars = queryMocks.mutate.mock.calls[0][0] as {
        id: string;
        form: { name: string };
      };
      expect(vars.id).toBe("r2");
      expect(vars.form.name).toBe("Legacy cars");
      expect(queryMocks.toastSuccess).toHaveBeenCalledWith("savePriceRule");
    });

    it("builds the update body from the nested form via bodyFn", async () => {
      renderSection();
      const update = queryMocks.mutationConfigs.find(
        (c) => c.method === "PATCH" && typeof c.endpoint === "function",
      ) as unknown as {
        endpoint: (vars: unknown) => unknown;
        bodyFn: (vars: unknown) => unknown;
      };
      const body = (update.bodyFn as (vars: unknown) => unknown)({
        id: "r2",
        form: {
          name: "Legacy cars",
          description: "",
          apply_to: "both",
          conditions_type: "make",
          conditions_makes: "Toyota, Lexus",
          conditions_models: "",
          conditions_classes: "",
          conditions_fuel_types: "",
          conditions_body_types: "",
          conditions_description: "",
          operator: "add_fixed",
          value: "25000",
          priority: "50",
          part_category: "",
          service_category: "",
          part_name_pattern: "",
          service_name_pattern: "",
        },
      });

      expect(body).toEqual({
        name: "Legacy cars",
        description: "",
        apply_to: "both",
        conditions: { makes: ["Toyota", "Lexus"] },
        conditions_description: "Make: Toyota, Lexus",
        operator: "add_fixed",
        value: 25000,
        priority: 50,
        part_category: null,
        service_category: null,
        part_name_pattern: null,
        service_name_pattern: null,
      });
    });
  });

  describe("toggle + delete", () => {
    it("toggles rule active state through togglePriceRule", async () => {
      renderSection();
      await screen.findByText("Luxury parts");

      // "Old cars" is inactive; flip it on
      const toggle = within(ruleRow("Old cars")).getByRole("switch");
      expect(toggle).not.toBeChecked();
      await userEvent.click(toggle);

      expect(queryMocks.mutate).toHaveBeenCalledWith({
        id: "r2",
        is_active: true,
      });
    });

    it("deletes a rule after confirmation", async () => {
      renderSection();
      await screen.findByText("Luxury parts");

      const rowButtons = within(ruleRow("Old cars")).getAllByRole("button");
      const trash = rowButtons[rowButtons.length - 1];
      await userEvent.click(trash);

      expect(
        await screen.findByText("deletePriceRuleTitle"),
      ).toBeInTheDocument();
      expect(screen.getByText("deletePriceRuleDesc")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "delete" }));

      await waitFor(() => {
        expect(queryMocks.mutate).toHaveBeenCalledWith("r2");
      });
      expect(queryMocks.toastSuccess).toHaveBeenCalledWith("deletePriceRule");
    });
  });
});
