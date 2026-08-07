import { describe, expect, it, vi } from "vitest";

// jsdom doesn't have matchMedia
vi.stubGlobal(
  "matchMedia",
  vi.fn(() => ({ matches: false })),
);

describe("useCountUp", () => {
  it("starts at 0", async () => {
    const { useCountUp } = await import("@/lib/hooks/use-count-up");
    const { renderHook } = await import("@testing-library/react");
    const { result } = renderHook(() => useCountUp(100));
    expect(result.current).toBe(0);
  });

  it("sets 0 immediately when target is 0", async () => {
    const { useCountUp } = await import("@/lib/hooks/use-count-up");
    const { renderHook } = await import("@testing-library/react");
    const { result } = renderHook(() => useCountUp(0));
    expect(result.current).toBe(0);
  });
});
