import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const submitBookingRequestMock = vi.fn();
const apiErrorMock = vi.fn();
const createdMock = vi.fn();

vi.mock("@/lib/public-booking-handler", () => ({
  createPublicBookingHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/booking-service", () => ({
  submitBookingRequest: submitBookingRequestMock,
}));

vi.mock("@/lib/api-response", () => ({
  apiError: apiErrorMock,
  created: createdMock,
}));

const { POST } = await import("./route");

describe("POST /api/booking/[token]", () => {
  const org = { id: "org-1", name: "Test Shop", slug: "test-shop" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a booking successfully", async () => {
    submitBookingRequestMock.mockResolvedValue({ appointmentId: "apt-1" });
    createdMock.mockImplementation((data) => {
      return new Response(JSON.stringify({ data }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    });

    const req = new NextRequest(
      new URL("http://localhost/api/booking/token-1"),
      {
        method: "POST",
        body: JSON.stringify({
          name: "John Doe",
          phone: "555-0100",
          plate: "ABC-1234",
        }),
      },
    );
    const response = await POST({ request: req, org, supabase: {} });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual({
      id: "apt-1",
      message:
        "Booking request submitted. The shop will contact you to confirm.",
    });
    expect(submitBookingRequestMock).toHaveBeenCalledWith({}, "org-1", {
      orgId: "org-1",
      name: "John Doe",
      phone: "555-0100",
      plate: "ABC-1234",
      notes: undefined,
      requestedDate: undefined,
    });
  });

  it("returns apiError when name is missing", async () => {
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "VALIDATION", message: "Name is required" },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/booking/token-1"),
      {
        method: "POST",
        body: JSON.stringify({ phone: "555-0100", plate: "ABC-1234" }),
      },
    );
    const response = await POST({ request: req, org, supabase: {} });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION");
    expect(apiErrorMock).toHaveBeenCalledWith(
      "VALIDATION",
      "Name is required",
      400,
    );
    expect(submitBookingRequestMock).not.toHaveBeenCalled();
  });

  it("returns apiError when phone is missing", async () => {
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "VALIDATION", message: "Phone number is required" },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/booking/token-1"),
      {
        method: "POST",
        body: JSON.stringify({ name: "John Doe", plate: "ABC-1234" }),
      },
    );
    const response = await POST({ request: req, org, supabase: {} });

    expect(response.status).toBe(400);
    expect(apiErrorMock).toHaveBeenCalledWith(
      "VALIDATION",
      "Phone number is required",
      400,
    );
    expect(submitBookingRequestMock).not.toHaveBeenCalled();
  });

  it("returns apiError when plate is missing", async () => {
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "VALIDATION", message: "Vehicle plate is required" },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/booking/token-1"),
      {
        method: "POST",
        body: JSON.stringify({ name: "John Doe", phone: "555-0100" }),
      },
    );
    const response = await POST({ request: req, org, supabase: {} });

    expect(response.status).toBe(400);
    expect(apiErrorMock).toHaveBeenCalledWith(
      "VALIDATION",
      "Vehicle plate is required",
      400,
    );
    expect(submitBookingRequestMock).not.toHaveBeenCalled();
  });

  it("handles service error", async () => {
    submitBookingRequestMock.mockRejectedValue(
      new Error("Something went wrong"),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/booking/token-1"),
      {
        method: "POST",
        body: JSON.stringify({
          name: "John Doe",
          phone: "555-0100",
          plate: "ABC-1234",
        }),
      },
    );
    await expect(POST({ request: req, org, supabase: {} })).rejects.toThrow(
      "Something went wrong",
    );
  });
});
