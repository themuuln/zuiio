import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signOutMock = vi.fn();
const createClientMock = vi.fn(async () => ({
  auth: { signOut: signOutMock },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

const { POST } = await import("./route");

describe("auth signout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out and redirects to the login page", async () => {
    const response = await POST(
      new NextRequest("https://tolom.example/mn/auth/signout", {
        method: "POST",
      }),
    );

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://tolom.example/auth/login",
    );
  });
});
