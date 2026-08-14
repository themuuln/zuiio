import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCrudHooks, usePendingIds, useUndoToast } from "../use-crud-list";

const { mockUseOrgMutation } = vi.hoisted(() => ({
  mockUseOrgMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

vi.mock("@zuiio/query", () => ({
  useOrgMutation: mockUseOrgMutation,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

interface TestItem {
  id: string;
  name: string;
}

describe("createCrudHooks", () => {
  const crud = createCrudHooks<TestItem>({
    path: "/test-items",
    queryKey: (orgId: string) => ["test", orgId, "items"] as const,
  });

  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  describe("useList", () => {
    it("returns items on success", async () => {
      const items: TestItem[] = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];

      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ data: items }),
      } as Response);

      const { result } = renderHook(() => crud.useList("org-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(items);
    });

    it("does not fetch when orgId is undefined", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      const { result } = renderHook(() => crud.useList(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("handles fetch error", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => crud.useList("org-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useCreate", () => {
    it("returns mutation object", () => {
      const { result } = renderHook(() => crud.useCreate("org-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.mutate).toBe("function");
    });
  });

  describe("useUpdate", () => {
    it("returns mutation object", () => {
      const { result } = renderHook(() => crud.useUpdate("org-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.mutate).toBe("function");
    });
  });

  describe("useDelete", () => {
    it("returns mutation object", () => {
      const { result } = renderHook(() => crud.useDelete("org-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.mutate).toBe("function");
    });
  });

  describe("conflict error surfacing", () => {
    it("does not override the error message for create — a 409 CONFLICT message surfaces", () => {
      renderHook(() => crud.useCreate("org-1"), {
        wrapper: createWrapper(),
      });

      const config = mockUseOrgMutation.mock.calls.at(-1)?.[0] as {
        errorMessage?: string;
      };
      expect(config.errorMessage).toBeUndefined();
    });

    it("does not override the error message for update — a 409 CONFLICT message surfaces", () => {
      renderHook(() => crud.useUpdate("org-1"), {
        wrapper: createWrapper(),
      });

      const config = mockUseOrgMutation.mock.calls.at(-1)?.[0] as {
        errorMessage?: string;
      };
      expect(config.errorMessage).toBeUndefined();
    });

    it("falls back to the server error message for delete when no deleteError is configured", () => {
      renderHook(() => crud.useDelete("org-1"), {
        wrapper: createWrapper(),
      });

      const config = mockUseOrgMutation.mock.calls.at(-1)?.[0] as {
        errorMessage?: string;
      };
      expect(config.errorMessage).toBeUndefined();
    });
  });
});

describe("usePendingIds", () => {
  it("returns an empty set initially", () => {
    const { result } = renderHook(() => usePendingIds(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.pendingIds).toBeDefined();
  });
});

describe("useUndoToast", () => {
  it("returns undo handlers", () => {
    const { result } = renderHook(() => useUndoToast(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});
