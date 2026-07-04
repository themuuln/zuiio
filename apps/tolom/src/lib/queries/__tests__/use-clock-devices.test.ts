import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import {
  useClockDevices,
  clockDeviceKeys,
  type ClockDevice,
} from "../use-clock-devices";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useClockDevices", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleDevices: ClockDevice[] = [
    {
      deviceId: "dev-1",
      mechanicId: "mech-1",
      mechanicName: "Bob",
      deviceName: "iPad #3",
      deviceFingerprint: "fp-abc123",
      lastUsedAt: "2024-02-10T08:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      revokedAt: null,
      isActive: true,
    },
  ];

  it("returns clock devices on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleDevices }),
    } as Response);

    const { result } = renderHook(() => useClockDevices("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleDevices);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useClockDevices(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useClockDevices("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("clockDeviceKeys", () => {
  it("constructs correct key shapes", () => {
    expect(clockDeviceKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "clock-devices",
    ]);
    expect(clockDeviceKeys.list("org-1")).toEqual([
      "organizations",
      "org-1",
      "clock-devices",
      "list",
    ]);
  });
});
