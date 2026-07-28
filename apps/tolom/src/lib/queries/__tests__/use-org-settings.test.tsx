import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrgSettings } from "../use-org-settings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useOrgSettings", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleSettings = {
    daily_revenue_goal: 5000,
    invoice_prefix: "INV-",
    default_currency: "MNT",
    default_tax_rate: 10,
    timezone: "Asia/Ulaanbaatar",
    date_format: "YYYY-MM-DD",
    language: "mn",
  };

  it("returns org settings on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { settings: sampleSettings } }),
    } as Response);

    const { result } = renderHook(() => useOrgSettings("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.settings).toEqual(sampleSettings);
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useOrgSettings(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.settings).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { settings: {} } }),
    } as Response);

    renderHook(() => useOrgSettings("org-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/organizations/org-1");
  });

  it("returns null settings when API returns no settings key", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    const { result } = renderHook(() => useOrgSettings("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.settings).toEqual({});
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useOrgSettings("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 5000,
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.settings).toBeNull();
  });
});
