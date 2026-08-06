import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { reportServerError } = vi.hoisted(() => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError,
}));

import { lookupPlate, type SmartCarVehicle } from "../browser";

const API_URL = "https://xyp-api.smartcar.mn/xyp-api/v1/xyp/get-data-public";

const fullApiResponse = {
  plateNumber: "ABC1234",
  cabinNumber: "JTEBU11F60K123456",
  countryName: "Mongolia",
  markName: "TOYOTA",
  modelName: "LAND CRUISER PRADO",
  buildYear: 2020,
  colorName: "White",
  type: "SUV",
  ownerType: "Private",
  className: "M1",
  motorNumber: "1GR12345",
  importDate: "2021-03-15",
  fuelType: "Petrol",
  manCount: 7,
  axleCount: 2,
  capacity: 3956.6,
  mass: 2150,
  weight: 2100,
  length: 4780,
  width: 1885,
  height: 1845,
  transmission: "Automatic",
  wheelPosition: "L",
  rfid: "RF123",
};

const expectedFullVehicle: SmartCarVehicle = {
  plateNumber: "ABC1234",
  make: "TOYOTA",
  model: "LAND CRUISER PRADO",
  year: 2020,
  vin: "JTEBU11F60K123456",
  category: "SUV",
  engineCc: 3957,
  transmission: "Automatic",
  fuelType: "Petrol",
  steering: "L",
  seats: 7,
  bodyType: "SUV",
  country: "Mongolia",
  color: "White",
  height: "1845",
  width: "1885",
  length: "4780",
  weight: "2150",
  importDate: "2021-03-15",
};

describe("lookupPlate", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // Fake timers so the 15s request-timeout timer never lingers in the real
    // event loop; only the timeout test advances them.
    vi.useFakeTimers();
    reportServerError.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("maps a successful response to SmartCarVehicle with all fields", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(fullApiResponse), { status: 200 }),
    );

    const result = await lookupPlate("abc 1234");

    expect(result).toEqual({ ok: true, data: expectedFullVehicle });
    expect(reportServerError).not.toHaveBeenCalled();
  });

  it("sends a POST with trimmed, upper-cased plate and correct headers", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(fullApiResponse), { status: 200 }),
    );

    await lookupPlate("  abc   1234 ");

    expect(fetch).toHaveBeenCalledWith(
      API_URL,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          os: "web",
          version: "3.2.0",
          referer: "https://smartcar.mn/",
          "accept-language": "mn",
        },
        body: JSON.stringify({
          serviceCode: "WS100401_getVehicleInfo",
          customFields: { plateNumber: "ABC1234" },
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("falls back to empty strings and null when fields are missing", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          plateNumber: "XYZ9",
          markName: "HONDA",
          cabinNumber: null,
          countryName: null,
          modelName: null,
          buildYear: null,
          colorName: null,
          type: null,
          ownerType: null,
          className: null,
          motorNumber: null,
          importDate: null,
          fuelType: null,
          manCount: null,
          axleCount: null,
          capacity: 0,
          mass: null,
          weight: null,
          length: null,
          width: null,
          height: null,
          transmission: null,
          wheelPosition: null,
          rfid: null,
        }),
        { status: 200 },
      ),
    );

    const result = await lookupPlate("XYZ9");

    expect(result).toEqual({
      ok: true,
      data: {
        plateNumber: "XYZ9",
        make: "HONDA",
        model: "",
        year: null,
        vin: "",
        category: "",
        engineCc: null,
        transmission: "",
        fuelType: "",
        steering: "",
        seats: null,
        bodyType: "",
        country: "",
        color: "",
        height: "",
        width: "",
        length: "",
        weight: "",
        importDate: "",
      },
    });
  });

  it("maps empty make when markName is absent but modelName is present", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          plateNumber: "XYZ9",
          markName: null,
          modelName: "ACCORD",
          cabinNumber: null,
          countryName: null,
          buildYear: null,
          colorName: null,
          type: null,
          ownerType: null,
          className: null,
          motorNumber: null,
          importDate: null,
          fuelType: null,
          manCount: null,
          axleCount: null,
          capacity: null,
          mass: null,
          weight: null,
          length: null,
          width: null,
          height: null,
          transmission: null,
          wheelPosition: null,
          rfid: null,
        }),
        { status: 200 },
      ),
    );

    const result = await lookupPlate("XYZ9");

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({ make: "", model: "ACCORD" }),
    });
  });

  it("returns an error for non-ok HTTP responses without reporting", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Not Found", { status: 404 }),
    );

    const result = await lookupPlate("ABC1234");

    expect(result).toEqual({
      ok: false,
      error: "SmartCar API returned 404: Not Found",
    });
    expect(reportServerError).not.toHaveBeenCalled();
  });

  it("handles response.text() failure on non-ok responses", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => {
        throw new Error("read failed");
      },
    } as unknown as Response);

    const result = await lookupPlate("ABC1234");

    expect(result).toEqual({ ok: false, error: "SmartCar API returned 500: " });
    expect(reportServerError).not.toHaveBeenCalled();
  });

  it("returns a no-vehicle-found error when markName and modelName are missing", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ plateNumber: "NOPE99" }), { status: 200 }),
    );

    const result = await lookupPlate("NOPE99");

    expect(result).toEqual({
      ok: false,
      error: 'No vehicle found for plate "NOPE99"',
    });
    expect(reportServerError).not.toHaveBeenCalled();
  });

  it("returns an error and reports when the JSON body is malformed", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("not-json", { status: 200 }),
    );

    const result = await lookupPlate("ABC1234");

    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.error).toMatch(/Unexpected token/);
    }
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(SyntaxError),
    );
  });

  it("returns the error message when fetch rejects", async () => {
    const networkError = new Error("Network failure");
    vi.mocked(fetch).mockRejectedValue(networkError);

    const result = await lookupPlate("ABC1234");

    expect(result).toEqual({ ok: false, error: "Network failure" });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      networkError,
    );
  });

  it("stringifies non-Error rejections", async () => {
    vi.mocked(fetch).mockRejectedValue("boom");

    const result = await lookupPlate("ABC1234");

    expect(result).toEqual({ ok: false, error: "boom" });
    expect(reportServerError).toHaveBeenCalledWith("Unexpected error", "boom");
  });

  it("returns a timeout error when the request exceeds 15s", async () => {
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(
              new DOMException("The operation was aborted.", "AbortError"),
            );
          });
        }),
    );

    const resultPromise = lookupPlate("ABC1234");
    await vi.advanceTimersByTimeAsync(15_000);
    const result = await resultPromise;

    expect(result).toEqual({
      ok: false,
      error: "SmartCar API timed out after 15000ms",
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(DOMException),
    );
  });
});
