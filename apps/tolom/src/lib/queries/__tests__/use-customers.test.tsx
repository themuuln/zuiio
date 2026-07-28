import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { customerKeys } from "../keys";
import {
  useCreateCustomer,
  useCustomerDuplicateCheck,
  useCustomers,
  useSharedCustomers,
} from "../use-customers";

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

const sampleCustomers = [
  {
    id: "cust-1",
    first_name: "Alice",
    last_name: null,
    phone: "976-99110001",
    email: "alice@example.com",
    organization_id: "org-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    notes: null,
    address: null,
    company_name: null,
    contact_person: null,
    customer_user_id: null,
    branch_id: null,
    last_visit_at: null,
    portal_token: null,
    source: null,
    tags: null,
    total_visits: 5,
    type: null,
    created_by: null,
    updated_by: null,
    vehicle_count: 2,
  },
  {
    id: "cust-2",
    first_name: "Bob",
    last_name: "Smith",
    phone: "976-99110002",
    email: "bob@example.com",
    organization_id: "org-1",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    deleted_at: null,
    notes: null,
    address: null,
    company_name: null,
    contact_person: null,
    customer_user_id: null,
    branch_id: "branch-1",
    last_visit_at: null,
    portal_token: null,
    source: null,
    tags: null,
    total_visits: 3,
    type: null,
    created_by: null,
    updated_by: null,
    vehicle_count: 1,
  },
];

describe("useCustomers", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns customers on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: sampleCustomers, count: 2 } }),
    } as Response);

    const { result } = renderHook(() => useCustomers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCustomers);
  });

  it("passes search query param", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [], count: 0 } }),
    } as Response);

    renderHook(() => useCustomers("org-1", "Alice"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("q=Alice");
  });

  it("passes branch_id param when branchId is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [], count: 0 } }),
    } as Response);

    renderHook(() => useCustomers("org-1", "", "branch-42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("branch_id=branch-42");
  });

  it("passes fast param when no branch is provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [], count: 0 } }),
    } as Response);

    renderHook(() => useCustomers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("fast=true");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useCustomers(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => useCustomers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it("handles network failure", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCustomers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});

describe("customerKeys", () => {
  it("constructs correct key shapes", () => {
    expect(customerKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "customers",
    ]);
    expect(customerKeys.list("org-1")).toEqual([
      "organizations",
      "org-1",
      "customers",
      "list",
      "",
    ]);
    expect(customerKeys.list("org-1", "Alice")).toEqual([
      "organizations",
      "org-1",
      "customers",
      "list",
      "Alice",
    ]);
    expect(customerKeys.detail("org-1", "cust-1")).toEqual([
      "organizations",
      "org-1",
      "customers",
      "detail",
      "cust-1",
    ]);
  });
});

describe("useSharedCustomers", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("returns shared customers on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: sampleCustomers, count: 2 } }),
    } as Response);

    const { result } = renderHook(() => useSharedCustomers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleCustomers);
  });

  it("passes shared=true and query params", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [], count: 0 } }),
    } as Response);

    renderHook(() => useSharedCustomers("org-1", "Alice"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("shared=true");
    expect(url).toContain("q=Alice");
  });

  it("passes shared=true without query when no query provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [], count: 0 } }),
    } as Response);

    renderHook(() => useSharedCustomers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("shared=true");
    expect(url).not.toContain("q=");
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useSharedCustomers(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(() => useSharedCustomers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it("handles network failure", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSharedCustomers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});

describe("useCreateCustomer", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns mutation object when orgId is provided", () => {
    const { result } = renderHook(() => useCreateCustomer("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("returns mutation object when orgId is undefined", () => {
    const { result } = renderHook(() => useCreateCustomer(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});

describe("useCustomerDuplicateCheck", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("does not fetch when orgId is missing", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useCustomerDuplicateCheck(undefined, "976-99110001"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when both phone and email are too short", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useCustomerDuplicateCheck("org-1", "ab", "xy"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when both phone and email are empty", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useCustomerDuplicateCheck("org-1", "", ""),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when phone is truthy but < 3 chars and email is absent", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(
      () => useCustomerDuplicateCheck("org-1", "ab"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns phoneMatch when phone matches a customer", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { data: sampleCustomers, count: 2 },
      }),
    } as Response);

    const { result } = renderHook(
      () => useCustomerDuplicateCheck("org-1", "976-99110001"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      phoneMatch: sampleCustomers[0],
      emailMatch: null,
    });
  });

  it("returns emailMatch when email matches a customer", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { data: sampleCustomers, count: 2 },
      }),
    } as Response);

    const { result } = renderHook(
      () => useCustomerDuplicateCheck("org-1", undefined, "alice@example.com"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      phoneMatch: null,
      emailMatch: sampleCustomers[0],
    });
  });

  it("returns object with null matches when phone/email do not match any customer", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { data: sampleCustomers, count: 2 },
      }),
    } as Response);

    const { result } = renderHook(
      () => useCustomerDuplicateCheck("org-1", "976-99999999"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      phoneMatch: undefined,
      emailMatch: null,
    });
  });

  it("returns null on fetch error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    } as Response);

    const { result } = renderHook(
      () => useCustomerDuplicateCheck("org-1", "976-99110001"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("enters error state on network failure", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useCustomerDuplicateCheck("org-1", "976-99110001"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("searches by phone when phone has 3+ chars even if email is short", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [], count: 0 } }),
    } as Response);

    renderHook(() => useCustomerDuplicateCheck("org-1", "976-99110001", "ab"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("q=976-99110001");
  });

  it("searches by email when phone is empty and email has 3+ chars", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: [], count: 0 } }),
    } as Response);

    renderHook(
      () => useCustomerDuplicateCheck("org-1", "", "bob@example.com"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain("q=bob%40example.com");
  });
});
