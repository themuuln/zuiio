import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { thresholdKeys, useSaveThreshold } from "../use-thresholds";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Mock useOrgMutation from @zuiio/query since it configures the mutation
vi.mock("@zuiio/query", () => ({
  useOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSaveThreshold", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("renders the mutation hook without crashing", () => {
    const { result } = renderHook(() => useSaveThreshold("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("accepts undefined orgId", () => {
    const { result } = renderHook(() => useSaveThreshold(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});

describe("thresholdKeys", () => {
  it("constructs correct key shape", () => {
    expect(thresholdKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "inventory",
      "thresholds",
    ]);
  });
});
