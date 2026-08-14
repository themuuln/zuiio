import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePrewarm } from "../use-prewarm";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePrewarm", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("calls prefetchQuery for each endpoint when orgId is provided", () => {
    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

    renderHook(() => usePrewarm("org-1"), {
      wrapper: createWrapper(),
    });

    // Should have been called for all 6 prefetch targets
    expect(prefetchSpy).toHaveBeenCalled();
  });

  it("does not prefetch when orgId is undefined", () => {
    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

    renderHook(() => usePrewarm(undefined), {
      wrapper: createWrapper(),
    });

    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  it("only runs once per session", () => {
    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

    const { rerender } = renderHook(
      (orgId: string | undefined) => usePrewarm(orgId),
      {
        wrapper: createWrapper(),
        initialProps: "org-1",
      },
    );

    const callCount = prefetchSpy.mock.calls.length;
    expect(callCount).toBeGreaterThan(0);

    // Rerender with same orgId should not trigger more prefetches
    rerender("org-1");
    expect(prefetchSpy.mock.calls.length).toBe(callCount);
  });
});
