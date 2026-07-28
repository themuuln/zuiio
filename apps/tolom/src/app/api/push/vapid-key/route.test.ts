import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const getVapidPublicKeyMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/web-push", () => ({
  getVapidPublicKey: getVapidPublicKeyMock,
}));

const { GET } = await import("./route");

describe("GET /api/push/vapid-key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the VAPID public key", async () => {
    getVapidPublicKeyMock.mockReturnValue("test-public-key-abc123");

    const req = new NextRequest("http://localhost/api/push/vapid-key");
    const response = await GET({
      request: req,
      supabase: {},
      user: { id: "user-1" },
    });
    const body = await response.json();

    expect(body.data).toEqual({ publicKey: "test-public-key-abc123" });
    expect(getVapidPublicKeyMock).toHaveBeenCalledOnce();
  });
});
