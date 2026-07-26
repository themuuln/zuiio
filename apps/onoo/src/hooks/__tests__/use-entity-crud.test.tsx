/// <reference types="@testing-library/jest-dom/vitest" />

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useEntityCrud } from "@/hooks/use-entity-crud";

// ── Mock dependencies ────────────────────────────────────────────────

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockMutationFns = vi.hoisted(() => {
  const fns: Array<{
    mutationFn?: (...args: unknown[]) => unknown;
    onSuccess?: () => void;
  }> = [];
  return {
    getHandlers: () => fns[fns.length - 1] || {},
    pushHandlers: (opts: Record<string, unknown>) => {
      fns.push(opts);
    },
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...(actual as object),
    useMutation: (opts: {
      mutationFn: (...args: unknown[]) => unknown;
      onSuccess: () => void;
    }) => {
      mockMutationFns.pushHandlers(opts);
      return {
        mutate: (...args: unknown[]) => {
          const result = opts.mutationFn(...args);
          if (
            result &&
            typeof (result as Promise<unknown>).then === "function"
          ) {
            (result as Promise<unknown>).then(() => opts.onSuccess?.());
          }
        },
        isPending: false,
      };
    },
  };
});

// ── Types ────────────────────────────────────────────────────────────

interface TestRow {
  id: string;
  name: string;
}

const testSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
});

// ── Wrapper ──────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────

describe("useEntityCrud", () => {
  const defaultConfig = {
    api: {
      create: vi.fn().mockResolvedValue({ id: "1", name: "test" }),
      update: vi.fn(),
      remove: vi.fn(),
    },
    queryKey: ["test-entities"],
    schema: testSchema,
    defaultValues: { name: "" },
    successMessages: {
      create: "Амжилттай үүсгэлээ",
      update: "Амжилттай шинэчлэлээ",
      delete: "Амжилттай устгалаа",
    },
    editMap: (row: TestRow) => ({ name: row.name }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial state with dialog closed", () => {
    const { result } = renderHook(() => useEntityCrud<TestRow>(defaultConfig), {
      wrapper: createWrapper(),
    });

    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.confirmOpen).toBe(false);
    expect(result.current.isMutating).toBe(false);
  });

  it("opens dialog for create when handleCreate is called", () => {
    const { result } = renderHook(() => useEntityCrud<TestRow>(defaultConfig), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleCreate();
    });

    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.editingItem).toBeNull();
  });

  it("opens dialog with pre-filled form for edit", () => {
    const row: TestRow = { id: "42", name: "Test Entity" };
    const { result } = renderHook(() => useEntityCrud<TestRow>(defaultConfig), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleEdit(row);
    });

    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.editingItem).toEqual(row);
  });

  it("calls api.create on handleSubmit when creating", async () => {
    const createMock = vi.fn().mockResolvedValue({ id: "1", name: "new" });
    const { result } = renderHook(
      () =>
        useEntityCrud<TestRow>({
          ...defaultConfig,
          api: { ...defaultConfig.api, create: createMock },
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.handleCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({ name: "new" });
    });

    expect(createMock).toHaveBeenCalledWith({ name: "new" });
  });

  it("calls api.update on handleSubmit when editing", async () => {
    const updateMock = vi.fn().mockResolvedValue({ id: "42", name: "Updated" });
    const row: TestRow = { id: "42", name: "Existing" };
    const { result } = renderHook(
      () =>
        useEntityCrud<TestRow>({
          ...defaultConfig,
          api: { ...defaultConfig.api, update: updateMock },
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.handleEdit(row);
    });
    await act(async () => {
      await result.current.handleSubmit({ name: "Updated" });
    });

    expect(updateMock).toHaveBeenCalledWith("42", { name: "Updated" });
  });

  it("opens confirm dialog on handleDelete", () => {
    const row: TestRow = { id: "42", name: "Delete Me" };
    const { result } = renderHook(() => useEntityCrud<TestRow>(defaultConfig), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleDelete(row);
    });

    expect(result.current.confirmOpen).toBe(true);
    expect(result.current.confirmItem).toEqual(row);
  });

  it("calls api.remove on confirm delete", async () => {
    const removeMock = vi.fn().mockResolvedValue(undefined);
    const row: TestRow = { id: "42", name: "Delete Me" };
    const { result } = renderHook(
      () =>
        useEntityCrud<TestRow>({
          ...defaultConfig,
          api: { ...defaultConfig.api, remove: removeMock },
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.handleDelete(row);
    });
    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(removeMock).toHaveBeenCalledWith("42");
    expect(result.current.confirmOpen).toBe(false);
    expect(result.current.confirmItem).toBeNull();
  });

  it("closes dialog without side effects", () => {
    const { result } = renderHook(() => useEntityCrud<TestRow>(defaultConfig), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleCreate();
    });
    expect(result.current.dialogOpen).toBe(true);

    act(() => {
      result.current.handleDialogOpenChange(false);
    });
    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
  });

  it("closes confirm dialog without side effects", () => {
    const row: TestRow = { id: "42", name: "Test" };
    const { result } = renderHook(() => useEntityCrud<TestRow>(defaultConfig), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleDelete(row);
    });
    expect(result.current.confirmOpen).toBe(true);

    act(() => {
      result.current.handleConfirmOpenChange(false);
    });
    expect(result.current.confirmOpen).toBe(false);
    expect(result.current.confirmItem).toBeNull();
  });
});
