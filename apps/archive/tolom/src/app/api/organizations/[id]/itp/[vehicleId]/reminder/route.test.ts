import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendItpReminderMock = vi.fn();
const apiErrorMock = vi.fn(
  (code: string, message: string, status: number) =>
    new Response(JSON.stringify({ error: { code, message } }), { status }),
);
const okMock = vi.fn(
  (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
);

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: apiErrorMock,
  ok: okMock,
}));

vi.mock("@/lib/services/itp-service", () => ({
  sendItpReminder: sendItpReminderMock,
}));

const { POST } = await import("./route");

describe("itp reminder route", () => {
  const orgId = "org-1";
  const vehicleId = "vehicle-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a reminder and returns sent true", async () => {
    sendItpReminderMock.mockResolvedValue({ sent: true, emailDelivered: true });

    const response = await POST({
      orgId,
      params: { vehicleId },
      request: new NextRequest(
        `http://localhost/api/organizations/${orgId}/itp/${vehicleId}/reminder`,
        { method: "POST" },
      ),
      supabase: { from: vi.fn() },
      user,
    });

    expect(sendItpReminderMock).toHaveBeenCalledWith(
      expect.anything(),
      vehicleId,
      orgId,
      user.id,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { sent: true, emailDelivered: true },
    });
  });

  it("returns a validation error when vehicleId is missing", async () => {
    const response = await POST({
      orgId,
      params: { vehicleId: "" },
      request: new NextRequest(
        `http://localhost/api/organizations/${orgId}/itp//reminder`,
        { method: "POST" },
      ),
      supabase: {},
      user,
    });

    expect(response.status).toBe(400);
    expect(apiErrorMock).toHaveBeenCalledWith(
      "VALIDATION",
      "vehicleId is required",
      400,
    );
    expect(sendItpReminderMock).not.toHaveBeenCalled();
  });
});
