import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBrandThemeQuery, useUpdateBrandTheme } from "../use-org-theme";

vi.mock("@zuiio/branding", () => ({
  generateBrandCSS: vi.fn(() => ":root { --brand: #6366f1; }"),
}));

vi.mock("@zuiio/hooks", () => ({
  useOnlineStatus: vi.fn(() => true),
}));

vi.mock("@/lib/offline/mutation-queue-provider", () => ({
  useMutationQueue: vi.fn(() => ({
    enqueue: vi.fn(),
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useBrandThemeQuery", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns theme on success", async () => {
    const theme = {
      branding: { theme: "zuiio" as const, radius: 0.5, logo_url: null },
      isDefault: false,
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: theme }),
    } as Response);

    const { result } = renderHook(() => useBrandThemeQuery("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(theme);
  });

  it("returns undefined when orgId is null (query disabled)", () => {
    const { result } = renderHook(() => useBrandThemeQuery(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("does not fetch when orgId is null", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    renderHook(() => useBrandThemeQuery(null), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBrandThemeQuery("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateBrandTheme", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns mutation object", () => {
    const { result } = renderHook(() => useUpdateBrandTheme("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});
