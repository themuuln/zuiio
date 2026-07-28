import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomerNotes } from "../use-customer-notes";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCustomerNotes", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleNotes = [
    {
      id: "note-1",
      organization_id: "org-1",
      customer_id: "cust-1",
      content: "Customer prefers morning appointments",
      type: "general",
      created_by: "staff-1",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      deleted_at: null,
    },
  ];

  it("returns customer notes on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleNotes }),
    } as Response);

    const { result } = renderHook(() => useCustomerNotes("org-1", "cust-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleNotes);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCustomerNotes(undefined, "cust-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when customerId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCustomerNotes("org-1", undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderHook(() => useCustomerNotes("org-1", "cust-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/api/organizations/org-1/customers/cust-42/notes");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCustomerNotes("org-1", "cust-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
