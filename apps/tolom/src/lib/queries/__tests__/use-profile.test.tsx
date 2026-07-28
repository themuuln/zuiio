import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentOrg, useCurrentUserRole, useProfile } from "../use-profile";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useProfile", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns profile on success", async () => {
    const profileData = {
      id: "user-1",
      email: "test@example.com",
      username: "testuser",
      phone: "555-0100",
      fullName: "Test User",
      avatarUrl: null,
      organizationId: "org-1",
      organizationName: "Test Org",
      branchId: "branch-1",
      roleId: "role-1",
      roleName: "Admin",
      permissionNames: ["users:read", "users:write"],
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => profileData,
    } as Response);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(profileData);
  });

  it("returns null when response is not ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });
  });
});

describe("useCurrentOrg", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("derives org info from profile", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "user-1",
        email: "test@example.com",
        organizationId: "org-1",
        organizationName: "Test Org",
        branchId: "branch-1",
      }),
    } as Response);

    const { result } = renderHook(() => useCurrentOrg(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.orgId).toBe("org-1");
    });

    expect(result.current.data?.orgName).toBe("Test Org");
    expect(result.current.data?.branchId).toBe("branch-1");
  });

  it("returns null data when profile has no org", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "user-1",
        email: "test@example.com",
        organizationId: null,
        organizationName: null,
        branchId: null,
      }),
    } as Response);

    const { result } = renderHook(() => useCurrentOrg(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });
});

describe("useCurrentUserRole", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("derives role info from profile", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "user-1",
        email: "test@example.com",
        roleId: "role-1",
        roleName: "Admin",
        permissionNames: ["users:read", "users:write"],
      }),
    } as Response);

    const { result } = renderHook(() => useCurrentUserRole(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.role).toBe("Admin");
    });
  });
});
