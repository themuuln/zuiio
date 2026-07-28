import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("auth/sso route", () => {
  const baseUrl = "http://localhost:3000/api/auth/sso";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("starts SSO login and returns redirect url", async () => {
      const supabase = createMockSupabaseClient();
      supabase.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: { url: "https://sso.zuiio.dev/auth" },
        error: null,
      });

      const request = new NextRequest(`${baseUrl}?next=/dashboard`);
      const response = await (GET as any)({ request, supabase });
      const body = await response.json();

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "custom:zuiio",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      });
      expect(body.data).toEqual({
        url: "https://sso.zuiio.dev/auth",
        next: "/dashboard",
      });
    });

    it("defaults next to /dashboard when not provided", async () => {
      const supabase = createMockSupabaseClient();
      supabase.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: { url: "https://sso.zuiio.dev/auth" },
        error: null,
      });

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, supabase });
      const body = await response.json();

      expect(body.data.next).toBe("/dashboard");
    });

    it("returns 500 when signInWithOAuth fails", async () => {
      const supabase = createMockSupabaseClient();
      supabase.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: { url: null },
        error: new Error("SSO provider unavailable"),
      });

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, supabase });
      const body = await response.json();

      expect(body.error).toBeDefined();
      expect(body.error.code).toBe("AUTH_START_FAILED");
      expect(response.status).toBe(500);
    });

    it("returns 500 when data.url is falsy", async () => {
      const supabase = createMockSupabaseClient();
      supabase.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: { url: null },
        error: null,
      });

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, supabase });
      const body = await response.json();

      expect(body.error).toBeDefined();
      expect(body.error.code).toBe("AUTH_START_FAILED");
      expect(response.status).toBe(500);
    });
  });
});
