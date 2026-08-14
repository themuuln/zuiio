import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookupVehicleByPlate } from "@/components/vehicles/form-sections/_plate-lookup";
import type {
  VehicleFormApi,
  VehicleFormT,
} from "@/components/vehicles/form-sections/_types";
import type { CarBrand } from "@/lib/queries/use-car-catalog";

const toastMocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastDismiss: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastMocks.toastError(...args),
    success: (...args: unknown[]) => toastMocks.toastSuccess(...args),
    dismiss: (...args: unknown[]) => toastMocks.toastDismiss(...args),
  },
}));

const BRANDS: CarBrand[] = [
  { id: "b1", name: "Toyota", country: "Japan", is_active: true },
  { id: "b2", name: "Honda", country: "Japan", is_active: true },
];

function makeForm() {
  return { setValue: vi.fn() } as unknown as VehicleFormApi;
}

function makeParams(
  overrides: Partial<Parameters<typeof lookupVehicleByPlate>[0]> = {},
) {
  const form = makeForm();
  const setLooking = vi.fn();
  const setPinnedBrands = vi.fn();
  let pinnedModels: string[] = [];
  const setPinnedModels = vi.fn((updater: (prev: string[]) => string[]) => {
    pinnedModels = updater(pinnedModels);
  });
  const t: VehicleFormT = vi.fn((key: string) => key) as VehicleFormT;
  return {
    params: {
      plate: "1234УНА",
      form,
      allBrands: BRANDS,
      t,
      setLooking,
      setPinnedBrands,
      setPinnedModels,
      ...overrides,
    },
    form,
    setLooking,
    setPinnedBrands,
    setPinnedModels,
    getPinnedModels: () => pinnedModels,
    t,
  };
}

function okResponse(data: unknown) {
  return { ok: true, json: async () => ({ data, error: null }) };
}

describe("lookupVehicleByPlate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a plate shorter than 7 characters without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { params, setLooking, t } = makeParams({ plate: "123" });
    await lookupVehicleByPlate(params);
    expect(toastMocks.toastError).toHaveBeenCalledWith("enterValidPlateFirst");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setLooking).not.toHaveBeenCalled();
    expect(t).toHaveBeenCalledWith("enterValidPlateFirst");
  });

  it("fills core, mapped and dimension fields from a successful lookup", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({
        make: "Toyota",
        model: "Camry",
        year: 2018,
        vin: "JT3HY86J1X0123456",
        engineCc: 2000,
        fuelType: "бензин",
        transmission: "механик",
        bodyType: "седан",
        color: "хар",
        country: "Japan",
        seats: 5,
        category: "Standard",
        importDate: "2019-07-08T00:00:00",
        steering: "баруун",
        height: 1450,
        width: 1820,
        length: 4800,
        weight: 1400,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { params, form, setLooking, setPinnedBrands, getPinnedModels } =
      makeParams();
    await lookupVehicleByPlate(params);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/smartcar/lookup?plate=1234%D0%A3%D0%9D%D0%90",
    );
    expect(form.setValue).toHaveBeenCalledWith("make", "Toyota");
    expect(form.setValue).toHaveBeenCalledWith("model", "Camry");
    expect(form.setValue).toHaveBeenCalledWith("year", "2018");
    expect(form.setValue).toHaveBeenCalledWith("vin", "JT3HY86J1X0123456");
    expect(form.setValue).toHaveBeenCalledWith("engine", "2000");
    expect(form.setValue).toHaveBeenCalledWith("fuelType", "Gasoline");
    expect(form.setValue).toHaveBeenCalledWith("transmission", "Manual");
    expect(form.setValue).toHaveBeenCalledWith("bodyType", "Sedan");
    expect(form.setValue).toHaveBeenCalledWith("color", "Black");
    expect(form.setValue).toHaveBeenCalledWith("countryOfOrigin", "Japan");
    expect(form.setValue).toHaveBeenCalledWith("seats", "5");
    expect(form.setValue).toHaveBeenCalledWith("category", "Standard");
    expect(form.setValue).toHaveBeenCalledWith("importDate", "2019-07-08");
    expect(form.setValue).toHaveBeenCalledWith("steering", "Right");
    expect(form.setValue).toHaveBeenCalledWith("height", "1450");
    expect(form.setValue).toHaveBeenCalledWith("width", "1820");
    expect(form.setValue).toHaveBeenCalledWith("length", "4800");
    expect(form.setValue).toHaveBeenCalledWith("weight", "1400");
    expect(setPinnedBrands).toHaveBeenCalledWith([BRANDS[0]]);
    expect(getPinnedModels()).toEqual(["Camry"]);
    expect(setLooking).toHaveBeenNthCalledWith(1, true);
    expect(setLooking).toHaveBeenLastCalledWith(false);
    expect(toastMocks.toastSuccess).toHaveBeenCalledWith("lookupComplete");
    expect(toastMocks.toastDismiss).toHaveBeenCalled();
  });

  it("does not pin a brand when the make is not in the catalog", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ make: "Tesla", model: "Model 3" }));
    vi.stubGlobal("fetch", fetchMock);
    const { params, setPinnedBrands } = makeParams();
    await lookupVehicleByPlate(params);
    expect(setPinnedBrands).not.toHaveBeenCalled();
  });

  it("deduplicates pinned models across repeated lookups", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ make: "Toyota", model: "Camry" }));
    vi.stubGlobal("fetch", fetchMock);
    const { params, getPinnedModels } = makeParams();
    await lookupVehicleByPlate(params);
    await lookupVehicleByPlate(params);
    expect(getPinnedModels()).toEqual(["Camry"]);
  });

  it("maps an unrecognised Mongolian body type verbatim", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ bodyType: "минивэн" }));
    vi.stubGlobal("fetch", fetchMock);
    const { params, form } = makeParams();
    await lookupVehicleByPlate(params);
    expect(form.setValue).toHaveBeenCalledWith("bodyType", "минивэн");
  });

  it("maps SUV, crossover and pickup body types", async () => {
    const cases: Array<[string, string]> = [
      ["туулах чадвар сайтай", "SUV"],
      ["SUV", "SUV"],
      ["кроссовер", "Crossover"],
      ["ачилтын машин", "Pickup"],
    ];
    for (const [input, expected] of cases) {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(okResponse({ bodyType: input }));
      vi.stubGlobal("fetch", fetchMock);
      const { params, form } = makeParams();
      await lookupVehicleByPlate(params);
      expect(form.setValue).toHaveBeenCalledWith("bodyType", expected);
      vi.unstubAllGlobals();
    }
  });

  it("shows the API error message on a failed response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "SmartCar down", data: null }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { params, form, setLooking } = makeParams();
    await lookupVehicleByPlate(params);
    expect(toastMocks.toastError).toHaveBeenCalledWith("SmartCar down");
    expect(form.setValue).not.toHaveBeenCalled();
    expect(setLooking).toHaveBeenLastCalledWith(false);
  });

  it("falls back to the generic message on a failed response without error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { params, t } = makeParams();
    await lookupVehicleByPlate(params);
    expect(toastMocks.toastError).toHaveBeenCalledWith("lookupFailed");
    expect(t).toHaveBeenCalledWith("lookupFailed");
  });

  it("shows the retry message and resets looking when fetch throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    const { params, setLooking, t } = makeParams();
    await lookupVehicleByPlate(params);
    expect(toastMocks.toastError).toHaveBeenCalledWith("lookupFailedTryAgain");
    expect(t).toHaveBeenCalledWith("lookupFailedTryAgain");
    expect(setLooking).toHaveBeenLastCalledWith(false);
  });

  it("leaves optional fields untouched when the payload omits them", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ make: "Toyota" }));
    vi.stubGlobal("fetch", fetchMock);
    const { params, form } = makeParams();
    await lookupVehicleByPlate(params);
    expect(form.setValue).toHaveBeenCalledTimes(1);
    expect(form.setValue).toHaveBeenCalledWith("make", "Toyota");
  });
});
