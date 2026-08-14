import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const getCurrentUserProfileMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/user-service", () => ({
  getCurrentUserProfile: getCurrentUserProfileMock,
}));

const { GET } = await import("./route");

describe("GET /api/profile", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current user profile", async () => {
    getCurrentUserProfileMock.mockResolvedValue({
      id: "user-1",
      full_name: "John Doe",
      email: "john@test.com",
      role: "admin",
    });

    const req = new NextRequest(new URL("http://localhost/api/profile"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({
      id: "user-1",
      full_name: "John Doe",
      email: "john@test.com",
      role: "admin",
    });
    expect(getCurrentUserProfileMock).toHaveBeenCalledWith({}, user);
  });

  it("returns null when user has no profile", async () => {
    getCurrentUserProfileMock.mockResolvedValue(null);

    const req = new NextRequest(new URL("http://localhost/api/profile"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toBeNull();
  });

  it("handles service error", async () => {
    getCurrentUserProfileMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(new URL("http://localhost/api/profile"));
    await expect(GET({ request: req, supabase: {}, user })).rejects.toThrow(
      "DB error",
    );
  });
});
