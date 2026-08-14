import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commissionKeys } from "../keys";
import {
  useCommissionRules,
  useCreateCommissionRule,
  useDeleteCommissionRule,
  useUpdateCommissionRule,
} from "../use-commission-rules";

vi.mock("@zuiio/query", () => ({
  useOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
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

describe("useCommissionRules", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns commission rules on success", async () => {
    const rules = [
      {
        id: "cr-1",
        name: "Standard Commission",
        commission_type: "percentage_of_labor",
        commission_value: 50,
        is_active: true,
        priority: 1,
        organization_id: "org-1",
        mechanic_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
      },
    ];

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: rules }),
    } as Response);

    const { result } = renderHook(() => useCommissionRules("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(rules);
  });

  it("does not fetch when orgId is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCommissionRules(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCommissionRules("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateCommissionRule", () => {
  it("returns mutation object", () => {
    const { result } = renderHook(() => useCreateCommissionRule("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useUpdateCommissionRule", () => {
  it("returns mutation object", () => {
    const { result } = renderHook(() => useUpdateCommissionRule("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useDeleteCommissionRule", () => {
  it("returns mutation object", () => {
    const { result } = renderHook(() => useDeleteCommissionRule("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("commissionKeys", () => {
  it("constructs correct key shapes", () => {
    expect(commissionKeys.all("org-1")).toEqual(["commission-rules", "org-1"]);
    expect(commissionKeys.list("org-1")).toEqual([
      "commission-rules",
      "org-1",
      "list",
    ]);
  });
});
