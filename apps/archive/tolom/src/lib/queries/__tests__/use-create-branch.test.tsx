import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateBranch } from "../use-create-branch";

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

describe("useCreateBranch", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object when orgId is provided", () => {
    const { result } = renderHook(() => useCreateBranch("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("returns mutation object when orgId is undefined", () => {
    const { result } = renderHook(() => useCreateBranch(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});
