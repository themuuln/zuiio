import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentOrg } from "../use-organization";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCurrentOrg (re-export from use-profile)", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns org info when profile has org data", async () => {
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

    // Wait for the profile query to succeed
    await vi.waitFor(() => {
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

    await vi.waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });
});
