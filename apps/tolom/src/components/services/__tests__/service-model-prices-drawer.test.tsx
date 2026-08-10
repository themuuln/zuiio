import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ServiceModelPricesDrawer } from "../service-model-prices-drawer";

// ── Mock state ─────────────────────────────────────────────────────────
const hooks = vi.hoisted(() => ({
  models: [] as Array<{ id: string; make: string; model: string }>,
  priceRows: [] as Array<{
    id: string;
    vehicle_model_id: string;
    vehicle_model_make: string;
    vehicle_model_model: string;
    specific_price: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>,
  modelsLoading: false,
  modelsError: false,
  upsert: vi.fn(),
}));

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" }, isPending: false }),
}));

vi.mock("@/lib/queries/use-service-vehicle-models", () => ({
  useOrgVehicleModels: () => ({
    data: hooks.models,
    isLoading: hooks.modelsLoading,
    isError: hooks.modelsError,
    error: hooks.modelsError ? new Error("models fetch failed") : null,
  }),
  useServiceVehicleModels: () => ({
    data: hooks.priceRows,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useUpsertServiceVehicleModelPrice: () => ({
    mutateAsync: hooks.upsert,
    isPending: false,
  }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────

const MODELS = [
  { id: "vm-1", make: "Toyota", model: "Camry" },
  { id: "vm-2", make: "Toyota", model: "Corolla" },
  { id: "vm-3", make: "Honda", model: "Civic" },
];

const PRICE_ROWS = [
  {
    id: "row-1",
    vehicle_model_id: "vm-1",
    vehicle_model_make: "Toyota",
    vehicle_model_model: "Camry",
    specific_price: 50000,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

function renderDrawer(overrides: { open?: boolean } = {}) {
  return render(
    <ServiceModelPricesDrawer
      serviceId="svc-1"
      serviceName="Oil change"
      defaultPrice={30000}
      open={overrides.open ?? true}
      onOpenChange={vi.fn()}
    />,
  );
}

function rowInputFor(modelName: string): HTMLInputElement {
  const row = screen.getByText(modelName).closest("div.rounded-lg");
  if (!row) throw new Error(`row for ${modelName} not found`);
  const input = row.querySelector<HTMLInputElement>("input");
  if (!input) throw new Error(`input for ${modelName} not found`);
  return input;
}

/**
 * Drive the controlled CurrencyInput deterministically: focus arms editing,
 * change sets the raw edit text, blur commits the parsed value.
 * (userEvent.keyboard does not honor the programmatic select-all, so typing
 * would append to the existing value instead of replacing it.)
 */
function setCurrency(input: HTMLInputElement, value: string) {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("ServiceModelPricesDrawer", () => {
  beforeEach(() => {
    hooks.models = MODELS;
    hooks.priceRows = PRICE_ROWS;
    hooks.modelsLoading = false;
    hooks.modelsError = false;
    hooks.upsert.mockReset();
    hooks.upsert.mockResolvedValue({ data: null, error: null });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders models grouped by make with existing prices and counts", () => {
    renderDrawer();

    // Makes sorted alphabetically (Honda before Toyota)
    expect(screen.getByText("Honda")).toBeInTheDocument();
    expect(screen.getByText("Toyota")).toBeInTheDocument();
    expect(screen.getByText("Civic")).toBeInTheDocument();
    expect(screen.getByText("Camry")).toBeInTheDocument();
    expect(screen.getByText("Corolla")).toBeInTheDocument();
    // Custom price hint for Camry (has a stored price)
    expect(screen.getByText(/customPrice\s*₮\s*50,000/)).toBeInTheDocument();
    // Default price hint for the two rows without custom prices
    expect(screen.getAllByText(/defaultPrice\s*₮\s*30,000/)).toHaveLength(2);
    // Badge: 1 custom out of 3
    expect(screen.getByText("customCount")).toBeInTheDocument();
  });

  it("filters models by search", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByPlaceholderText("searchMakesModels"), "civic");

    expect(screen.queryByText("Camry")).not.toBeInTheDocument();
    expect(screen.queryByText("Corolla")).not.toBeInTheDocument();
    expect(screen.getByText("Civic")).toBeInTheDocument();
    expect(screen.queryByText("Toyota")).not.toBeInTheDocument();
  });

  it("shows a loading spinner while models load", () => {
    hooks.modelsLoading = true;
    renderDrawer();
    expect(document.querySelector(".animate-spin")).not.toBeNull();
  });

  it("shows the error state when the models fetch fails", () => {
    hooks.modelsError = true;
    renderDrawer();
    expect(screen.getByText("failedToLoad")).toBeInTheDocument();
    expect(screen.getByText("models fetch failed")).toBeInTheDocument();
  });

  it("shows an empty state when there are no vehicle models", () => {
    hooks.models = [];
    hooks.priceRows = [];
    renderDrawer();
    expect(screen.getByText("noModelsFound")).toBeInTheDocument();
  });

  it("saves edited prices with the expected payload", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ServiceModelPricesDrawer
        serviceId="svc-1"
        serviceName="Oil change"
        defaultPrice={30000}
        open
        onOpenChange={onOpenChange}
      />,
    );

    // Save is disabled until a price changes
    expect(screen.getByRole("button", { name: /save/ })).toBeDisabled();

    const camryInput = rowInputFor("Camry");
    setCurrency(camryInput, "45000");

    // Changed row shows the will-save hint
    expect(
      await screen.findByText(/willSave\s*₮\s*45,000/),
    ).toBeInTheDocument();
    const saveButton = screen.getByRole("button", { name: "save (1)" });
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    await waitFor(() =>
      expect(hooks.upsert).toHaveBeenCalledWith({
        vehicle_model_id: "vm-1",
        specific_price: 45000,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("modelsUpdated"),
    );

    // After save the change set clears → button disabled again
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save/ })).toBeDisabled(),
    );
  });

  it("shows an error toast when a price save fails", async () => {
    const user = userEvent.setup();
    hooks.upsert.mockRejectedValue(new Error("save failed"));
    renderDrawer();

    const camryInput = rowInputFor("Camry");
    setCurrency(camryInput, "45000");

    await user.click(await screen.findByRole("button", { name: "save (1)" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("pricesFailed"),
      ),
    );
  });

  it("prompts to discard changes and keeps editing when cancelled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ServiceModelPricesDrawer
        serviceId="svc-1"
        serviceName="Oil change"
        defaultPrice={30000}
        open
        onOpenChange={onOpenChange}
      />,
    );

    const camryInput = rowInputFor("Camry");
    setCurrency(camryInput, "45000");

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.getByText("discardTitle")).toBeInTheDocument();

    const keep = screen.getByRole("button", { name: "keepEditing" });
    fireEvent.pointerDown(keep, { pointerType: "mouse" });
    fireEvent.click(keep);

    // Drawer stays open and keeps the pending changes
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "save (1)" })).toBeEnabled();
  });

  it("discards changes and closes when confirmed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ServiceModelPricesDrawer
        serviceId="svc-1"
        serviceName="Oil change"
        defaultPrice={30000}
        open
        onOpenChange={onOpenChange}
      />,
    );

    const camryInput = rowInputFor("Camry");
    setCurrency(camryInput, "45000");

    await user.click(screen.getByRole("button", { name: "cancel" }));
    await user.click(screen.getByRole("button", { name: "discardChanges" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("applies the default price to every model via the bulk action", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "setAllDefault" }));

    const saveButton = screen.getByRole("button", { name: "save (3)" });
    await user.click(saveButton);

    await waitFor(() => expect(hooks.upsert).toHaveBeenCalledTimes(3));
    expect(hooks.upsert).toHaveBeenCalledWith({
      vehicle_model_id: "vm-3",
      specific_price: 30000,
    });
  });

  it("resets a custom price back to default with the row reset button", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const resetButton = screen.getByRole("button", { name: "resetToDefault" });
    await act(async () => {
      fireEvent.click(resetButton);
    });

    expect(
      await screen.findByText(/willSave\s*willSaveDefault/),
    ).toBeInTheDocument();
    const saveButton = screen.getByRole("button", { name: "save (1)" });
    await user.click(saveButton);

    await waitFor(() =>
      expect(hooks.upsert).toHaveBeenCalledWith({
        vehicle_model_id: "vm-1",
        specific_price: null,
      }),
    );
  });
});
