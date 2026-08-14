import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const removeSubscriptionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/push-service", () => ({
  removeSubscription: removeSubscriptionMock,
}));

const { POST } = await import("./route");

describe("POST /api/push/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unsubscribes successfully", async () => {
    removeSubscriptionMock.mockResolvedValue(undefined);

    const req = new NextRequest(
      new URL("http://localhost/api/push/unsubscribe"),
      {
        method: "POST",
        body: JSON.stringify({ endpoint: "https://fcm.example.com/abc" }),
      },
    );
    const response = await POST({ request: req, supabase: {} });
    const body = await response.json();

    expect(removeSubscriptionMock).toHaveBeenCalledWith(
      {},
      "https://fcm.example.com/abc",
    );
    expect(body.data).toEqual({ success: true });
  });

  it("throws on invalid body", async () => {
    const req = new NextRequest(
      new URL("http://localhost/api/push/unsubscribe"),
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    await expect(POST({ request: req, supabase: {} })).rejects.toThrow();
  });

  it("handles service error", async () => {
    removeSubscriptionMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      new URL("http://localhost/api/push/unsubscribe"),
      {
        method: "POST",
        body: JSON.stringify({ endpoint: "https://fcm.example.com/abc" }),
      },
    );

    await expect(POST({ request: req, supabase: {} })).rejects.toThrow(
      "DB error",
    );
  });
});
