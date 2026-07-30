import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("dv-inspections/public/[token] GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(token: string) {
    return new NextRequest(
      `http://localhost/api/dv-inspections/public/${token}`,
    );
  }

  it("returns inspection with vehicle and items", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "insp-1",
                status: "sent",
                odometer: 50000,
                fuel_level: "75%",
                technician_notes: "Check front brakes",
                vehicle: {
                  plate_number: "001 УНБ",
                  make: "Toyota",
                  model: "Camry",
                  year: 2020,
                },
                items: [
                  {
                    id: "item-1",
                    category: "brakes",
                    item_name: "Front brake pads",
                    condition: "poor",
                    severity: "major",
                    estimated_cost: 120000,
                    customer_approved: null,
                    technician_notes: "Worn out",
                    has_photo: true,
                    photo_urls: ["https://r2.example.com/photo-1.jpg"],
                  },
                ],
              },
              error: null,
            }),
          })),
        })),
      })),
    };
    const response = await (GET as any)({ request: makeRequest("valid-token"), supabase });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe("insp-1");
    expect(body.data.vehicle.plate_number).toBe("001 УНБ");
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total_estimated_cost).toBe(120000);
  });

  it("returns 404 for invalid token", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("not found"),
            }),
          })),
        })),
      })),
    };
    const response = await (GET as any)({ request: makeRequest("bad-token"), supabase });
    expect(response.status).toBe(404);
  });

  it("returns 400 for missing token", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest("http://localhost/api/dv-inspections/public/");
    const response = await (GET as any)({ request, supabase });
    expect(response.status).toBe(400);
  });

  it("handles malformed data gracefully", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { not_really_an_inspection: true },
              error: null,
            }),
          })),
        })),
      })),
    };
    const response = await (GET as any)({ request: makeRequest("weird-token"), supabase });
    // Missing "id" and "items" keys should return INVALID_DATA
    expect(response.status).toBe(500);
  });

  it("handles missing vehicle gracefully", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "insp-2",
                status: "sent",
                odometer: null,
                fuel_level: null,
                technician_notes: null,
                vehicle: null,
                items: [],
              },
              error: null,
            }),
          })),
        })),
      })),
    };
    const response = await (GET as any)({ request: makeRequest("no-vehicle"), supabase });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.vehicle).toBeNull();
    expect(body.data.items).toEqual([]);
    expect(body.data.total_estimated_cost).toBe(0);
  });
});
