/**
 * Tests for useDeleteWithConfirm hook.
 */
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock tanstack/react-query before any imports
vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useDeleteWithConfirm } from "../use-delete-with-confirm";

// A minimal wrapper that provides the mocked query context
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
  };
}

describe("useDeleteWithConfirm", () => {
  const originalConfirm = window.confirm;

  beforeEach(() => {
    window.confirm = originalConfirm;
    vi.clearAllMocks();
  });

  it("returns handleDelete and isPending", () => {
    const mutationFn = vi.fn();
    const { result } = renderHook(
      () =>
        useDeleteWithConfirm({
          mutationFn,
          queryKey: ["test"],
          entityName: "Бараа",
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current).toHaveProperty("handleDelete");
    expect(result.current).toHaveProperty("isPending");
    expect(result.current).toHaveProperty("error");
    expect(typeof result.current.handleDelete).toBe("function");
  });

  it("cancels when window.confirm returns false", () => {
    const mutationFn = vi.fn();
    window.confirm = vi.fn(() => false);

    const { result } = renderHook(
      () =>
        useDeleteWithConfirm({
          mutationFn,
          queryKey: ["test"],
          entityName: "Бараа",
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.handleDelete("id-1");
    });

    expect(window.confirm).toHaveBeenCalledTimes(1);
  });

  it("shows confirm dialog with correct message", () => {
    const mutationFn = vi.fn();
    window.confirm = vi.fn(() => false);

    const { result } = renderHook(
      () =>
        useDeleteWithConfirm({
          mutationFn,
          queryKey: ["test"],
          entityName: "Бараа",
          itemName: "TestItem",
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.handleDelete("id-1");
    });

    const confirmMsg = (window.confirm as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(confirmMsg).toContain("TestItem");
    expect(confirmMsg).toContain("Бараа");
  });
});
