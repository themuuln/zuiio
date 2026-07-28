import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const lookupPlateMock = vi.fn();
vi.mock("@/lib/smartcar/browser", () => ({
  lookupPlate: lookupPlateMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("GET /api/smartcar/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeRequest = (plate: string | null): NextRequest => {
    const url = plate
      ? `http://localhost/api/smartcar/lookup?plate=${plate}`
      : "http://localhost/api/smartcar/lookup";
    return new NextRequest(new URL(url));
  };

  const mockVehicle = {
    plateNumber: "4222УНА",
    make: "TOYOTA",
    model: "PREMIO",
    year: 2008,
    vin: "ZZZ123456789",
    category: "passenger",
    engineCc: 1500,
    transmission: "automatic",
    fuelType: "petrol",
    steering: "left",
    seats: 5,
    bodyType: "sedan",
    country: "Japan",
    color: "white",
    height: "1430",
    width: "1700",
    length: "4600",
    weight: "1200",
    importDate: "2020-01-15",
  };

  it("returns vehicle data for a valid plate", async () => {
    lookupPlateMock.mockResolvedValue({ ok: true, data: mockVehicle });

    const request = makeRequest("4222УНА");
    const response = await (GET as any)({ request });
    const body = await response.json();

    expect(lookupPlateMock).toHaveBeenCalledWith("4222УНА");
    expect(body.data).toEqual({ vehicle: mockVehicle, cached: false });
    expect(response.status).toBe(200);
  });

  it("returns 400 when plate parameter is missing", async () => {
    const request = makeRequest(null);
    const response = await (GET as any)({ request });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("MISSING_PARAM");
    expect(body.error.message).toContain("plate");
  });

  it("returns 400 for invalid plate format", async () => {
    const request = makeRequest("INVALID");
    const response = await (GET as any)({ request });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_FORMAT");
    expect(body.error.message).toContain("plate format");
  });

  it("returns 429 when rate limited", async () => {
    // Make enough requests to exhaust the per-IP rate limit (10 attempts per minute)
    const ip = "10.0.0.1";
    for (let i = 0; i < 10; i++) {
      const req = makeRequest("4222УНА");
      req.headers.set("x-forwarded-for", ip);
      await (GET as any)({ request: req });
    }

    // The 11th request should hit the rate limit
    const request = makeRequest("4222УНА");
    request.headers.set("x-forwarded-for", ip);
    const response = await (GET as any)({ request });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.error.message).toContain("Rate limit");
  });
});
