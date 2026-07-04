import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import {
  useAdminMe,
  useAdminOrganizations,
  adminKeys,
  type AdminMe,
  type AdminOrg,
} from "../use-admin";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAdminMe", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns admin profile on success", async () => {
    const admin: AdminMe = {
      isSuperAdmin: true,
      role: "super_admin",
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: admin }),
    } as Response);

    const { result } = renderHook(() => useAdminMe(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(admin);
  });

  it("calls /api/admin/me endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { isSuperAdmin: false, role: null } }),
    } as Response);

    renderHook(() => useAdminMe(), { wrapper: createWrapper() });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/admin/me");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAdminMe(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useAdminOrganizations", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleOrgs: AdminOrg[] = [
    {
      id: "org-1",
      name: "Test Garage",
      plan_type: "pro",
      status: "active",
      owner_name: "Alice",
      owner_email: "alice@example.com",
      created_at: "2024-01-01T00:00:00Z",
      trial_ends_at: null,
    },
  ];

  it("returns organizations on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleOrgs }),
    } as Response);

    const { result } = renderHook(() => useAdminOrganizations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleOrgs);
  });

  it("calls /api/admin/organizations endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useAdminOrganizations(), { wrapper: createWrapper() });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/admin/organizations");
  });

  it("defaults to empty array when data is null", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    const { result } = renderHook(() => useAdminOrganizations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAdminOrganizations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("adminKeys", () => {
  it("constructs correct key shapes", () => {
    expect(adminKeys.all).toEqual(["admin"]);
    expect(adminKeys.me()).toEqual(["admin", "me"]);
    expect(adminKeys.organizations()).toEqual(["admin", "organizations"]);
  });
});
