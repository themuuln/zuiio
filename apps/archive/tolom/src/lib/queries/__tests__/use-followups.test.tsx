import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFollowupDetail, useFollowups } from "../use-followups";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useFollowups", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleResponse = {
    data: [
      {
        id: "fup-1",
        subject: "Check oil leak",
        type: "call",
        status: "pending",
        due_at: "2024-02-01T10:00:00Z",
        notes: null,
        outcome: null,
        outcome_notes: null,
      },
    ],
    count: 1,
  };

  it("returns followups on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    } as Response);

    const { result } = renderHook(() => useFollowups("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleResponse);
  });

  it("passes filter params", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    } as Response);

    renderHook(
      () => useFollowups("org-1", { status: "pending", page: 2, limit: 10 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("/api/organizations/org-1/followups");
    expect(url).toContain("status=pending");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useFollowups("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useFollowupDetail", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleDetail = {
    data: {
      id: "fup-1",
      subject: "Check oil leak",
      type: "call",
      status: "pending",
      due_at: "2024-02-01T10:00:00Z",
      notes: null,
      outcome: null,
      outcome_notes: null,
    },
  };

  it("returns followup detail on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => sampleDetail,
    } as Response);

    const { result } = renderHook(() => useFollowupDetail("org-1", "fup-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleDetail);
  });

  it("does not fetch when followupId is null", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useFollowupDetail("org-1", null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => sampleDetail,
    } as Response);

    renderHook(() => useFollowupDetail("org-1", "fup-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe("/api/organizations/org-1/followups/fup-42");
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useFollowupDetail("org-1", "fup-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
