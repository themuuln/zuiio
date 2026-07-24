import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleAuthRedirect, redirectToLogin } from "./auth-redirect";

describe("redirectToLogin", () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        origin: "https://tolom.app",
        href: "https://tolom.app/dashboard",
      },
    });

    // Mock sessionStorage
    const store: Record<string, string> = {};
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to /auth/login with redirectTo parameter", () => {
    redirectToLogin();

    expect(window.location.href).toBe(
      "https://tolom.app/auth/login?redirectTo=https%3A%2F%2Ftolom.app%2Fdashboard",
    );
  });

  it("sets inflight flag to prevent duplicate redirects", () => {
    redirectToLogin();
    expect(sessionStorage.getItem("__auth_redirect_inflight")).toBe("1");
  });

  it("is no-op on second call (inflight flag set)", () => {
    redirectToLogin();
    const firstHref = window.location.href;

    // Second call should not change href
    redirectToLogin();
    expect(window.location.href).toBe(firstHref);
  });
});

describe("handleAuthRedirect", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        origin: "https://tolom.app",
        href: "https://tolom.app/page",
        assign: vi.fn(),
      },
    });
  });

  it("returns false for successful response", () => {
    const res = new Response("OK", { status: 200 });
    expect(handleAuthRedirect(res)).toBe(false);
  });

  it("returns false for 401 without X-Auth-Required header", () => {
    const res = new Response("Unauthorized", { status: 401 });
    expect(handleAuthRedirect(res)).toBe(false);
  });

  it("returns true and redirects for 401 with X-Auth-Required header", () => {
    const res = new Response("Unauthorized", {
      status: 401,
      headers: { "X-Auth-Required": "true" },
    });
    expect(handleAuthRedirect(res)).toBe(true);
  });
});
