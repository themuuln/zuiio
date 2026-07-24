import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth-redirect at module level for tests that need it
const mockRedirectToLogin = vi.fn();
vi.mock("@/lib/auth-redirect", () => ({
  redirectToLogin: mockRedirectToLogin,
}));

import { safeFetch } from "./safe-fetch";

describe("safeFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    mockRedirectToLogin.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns response for successful fetch", async () => {
    const mockResponse = new Response(JSON.stringify({ data: "ok" }), {
      status: 200,
    });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const result = await safeFetch("https://api.example.com/data");
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body).toEqual({ data: "ok" });
  });

  it("returns 401 response when X-Auth-Required is not set", async () => {
    const mockResponse = new Response("Unauthorized", { status: 401 });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const result = await safeFetch("https://api.example.com/data");
    expect(result.status).toBe(401);
  });

  it("throws and redirects on 401 with X-Auth-Required header", async () => {
    const mockResponse = new Response("Unauthorized", {
      status: 401,
      headers: { "X-Auth-Required": "true" },
    });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    await expect(safeFetch("https://api.example.com/data")).rejects.toThrow(
      "Session expired",
    );
    expect(mockRedirectToLogin).toHaveBeenCalled();
  });

  it("passes through init options", async () => {
    const mockResponse = new Response(JSON.stringify({ created: true }), {
      status: 201,
    });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    await safeFetch("https://api.example.com/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/data",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
});
