import { renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRequireAuth } from "./use-require-auth";

const mockRedirectToLogin = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-redirect", () => ({
  redirectToLogin: mockRedirectToLogin,
}));

describe("useRequireAuth", () => {
  beforeEach(() => {
    mockRedirectToLogin.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls fetch /api/profile with HEAD on mount", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    renderHook(() => useRequireAuth());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/profile", {
        method: "HEAD",
        signal: expect.any(AbortSignal),
      });
    });
  });

  it("calls redirectToLogin on 401 with X-Auth-Required: true header", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 401,
        headers: { "X-Auth-Required": "true" },
      }),
    );

    renderHook(() => useRequireAuth());

    await waitFor(() => {
      expect(mockRedirectToLogin).toHaveBeenCalledOnce();
    });
  });

  it("does NOT call redirectToLogin on 401 without X-Auth-Required header", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    renderHook(() => useRequireAuth());

    await waitFor(() => {
      expect(mockRedirectToLogin).not.toHaveBeenCalled();
    });
  });

  it("caches result for 60s on success (no second fetch)", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    // Use StrictMode so the component goes through mount-unmount-mount.
    // The first effect's fetch resolves and sets lastCheckedRef.current,
    // then the second effect sees the cache and skips the fetch.
    renderHook(() => useRequireAuth(), {
      wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("aborts fetch on unmount", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise<Response>(() => {}),
    );

    const { unmount } = renderHook(() => useRequireAuth());
    unmount();

    expect(abortSpy).toHaveBeenCalledOnce();
  });

  it("handles network error gracefully (no crash)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    const { result } = renderHook(() => useRequireAuth());

    // Let the rejected promise's .catch run
    await vi.waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });
});
