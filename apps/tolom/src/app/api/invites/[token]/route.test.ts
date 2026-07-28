import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const getInviteByTokenMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/invite-service", () => ({
  getInviteByToken: getInviteByTokenMock,
}));

const { GET } = await import("./route");

describe("GET /api/invites/[token]", () => {
  const invite = {
    id: "invite-1",
    token: "abc123def456",
    organization_id: "org-1",
    organization_name: "Test Shop",
    email: "test@example.com",
    role: "admin",
    status: "pending",
    inviter_name: "John",
    created_at: "2025-01-01T00:00:00Z",
    expires_at: "2025-02-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invite by token", async () => {
    getInviteByTokenMock.mockResolvedValue(invite);

    const req = new NextRequest(
      new URL("http://localhost/api/invites/abc123def456"),
    );
    const response = await GET({ request: req, supabase: {} });
    const body = await response.json();

    expect(getInviteByTokenMock).toHaveBeenCalledWith({}, "abc123def456");
    expect(body.data).toEqual(invite);
  });

  it("handles service error", async () => {
    getInviteByTokenMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      new URL("http://localhost/api/invites/abc123def456"),
    );
    await expect(GET({ request: req, supabase: {} })).rejects.toThrow(
      "DB error",
    );
  });
});
