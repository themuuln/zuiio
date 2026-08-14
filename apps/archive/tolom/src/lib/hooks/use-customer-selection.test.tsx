import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Customer } from "@/lib/types";
import { useCustomerSelection } from "./use-customer-selection";

// ── Mock query hooks ──────────────────────────────────────────────

const mockUseCustomerSearch = vi.fn();
const mockUseCustomersByPlate = vi.fn();

vi.mock("@/lib/queries/use-wizard-data", () => ({
  useCustomerSearch: (...args: unknown[]) => mockUseCustomerSearch(...args),
  useCustomersByPlate: (...args: unknown[]) => mockUseCustomersByPlate(...args),
}));

// ── Helpers ───────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function makeCustomer(id: string, firstName: string): Customer {
  return {
    id,
    organization_id: "org-1",
    branch_id: null,
    first_name: firstName,
    last_name: "Test",
    full_name: null,
    phone: "+97699111111",
    email: null,
    address: null,
    company_name: null,
    contact_person: null,
    type: "individual",
    source: null,
    tags: null,
    notes: null,
    customer_user_id: null,
    total_visits: 0,
    last_visit_at: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
  } as Customer;
}

// ── Tests ─────────────────────────────────────────────────────────

describe("useCustomerSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial empty state", () => {
    mockUseCustomerSearch.mockReturnValue({
      data: undefined,
      isFetching: false,
    });
    mockUseCustomersByPlate.mockReturnValue({
      data: undefined,
      isFetching: false,
    });

    const { result } = renderHook(() => useCustomerSelection("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.customerSearch).toBe("");
    expect(result.current.customers).toEqual([]);
    expect(result.current.selectedCustomer).toBeNull();
    expect(result.current.customerSearching).toBe(false);
    expect(result.current.showQuickCustomer).toBe(false);
  });

  it("sets customers from search results", async () => {
    const customers = [
      makeCustomer("cust-1", "John"),
      makeCustomer("cust-2", "Jane"),
    ];

    mockUseCustomerSearch.mockReturnValue({
      data: customers,
      isFetching: false,
    });
    mockUseCustomersByPlate.mockReturnValue({ data: [], isFetching: false });

    const { result } = renderHook(() => useCustomerSelection("org-1"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setCustomerSearch("John");
    });

    await waitFor(() => {
      expect(result.current.customers).toHaveLength(2);
    });
    expect(result.current.customers).toEqual(customers);
    expect(result.current.customerSearching).toBe(false);
  });

  it("merges results from both search sources", async () => {
    const nameResults = [makeCustomer("cust-1", "John")];
    const plateResults = [makeCustomer("cust-2", "Jane")];

    mockUseCustomerSearch.mockReturnValue({
      data: nameResults,
      isFetching: false,
    });
    mockUseCustomersByPlate.mockReturnValue({
      data: plateResults,
      isFetching: false,
    });

    const { result } = renderHook(() => useCustomerSelection("org-1"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setCustomerSearch("search");
    });

    await waitFor(() => {
      expect(result.current.customers).toHaveLength(2);
    });
  });

  it("deduplicates customers that appear in both search results", async () => {
    const nameResults = [makeCustomer("cust-1", "John")];
    const plateResults = [makeCustomer("cust-1", "John")];

    mockUseCustomerSearch.mockReturnValue({
      data: nameResults,
      isFetching: false,
    });
    mockUseCustomersByPlate.mockReturnValue({
      data: plateResults,
      isFetching: false,
    });

    const { result } = renderHook(() => useCustomerSelection("org-1"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setCustomerSearch("John");
    });

    await waitFor(() => {
      expect(result.current.customers).toHaveLength(1);
    });
  });

  it("handleSelectCustomer selects customer and clears search", () => {
    mockUseCustomerSearch.mockReturnValue({ data: [], isFetching: false });
    mockUseCustomersByPlate.mockReturnValue({ data: [], isFetching: false });

    const { result } = renderHook(() => useCustomerSelection("org-1"), {
      wrapper: createWrapper(),
    });

    const customer = makeCustomer("cust-1", "John");

    act(() => {
      result.current.handleSelectCustomer(customer);
    });

    expect(result.current.selectedCustomer).toEqual(customer);
    expect(result.current.customerSearch).toBe("");
    expect(result.current.showQuickCustomer).toBe(false);
  });

  it("clears customers when search is cleared", async () => {
    const customers = [makeCustomer("cust-1", "John")];

    mockUseCustomerSearch.mockReturnValue({
      data: customers,
      isFetching: false,
    });
    mockUseCustomersByPlate.mockReturnValue({ data: [], isFetching: false });

    const { result } = renderHook(() => useCustomerSelection("org-1"), {
      wrapper: createWrapper(),
    });

    // Populate with search results
    act(() => {
      result.current.setCustomerSearch("John");
    });

    await waitFor(() => {
      expect(result.current.customers).toHaveLength(1);
    });

    // Clear search
    act(() => {
      result.current.setCustomerSearch("");
    });

    await waitFor(() => {
      expect(result.current.customers).toHaveLength(0);
    });
    expect(result.current.selectedCustomer).toBeNull();
  });

  it("returns searching state when either query is fetching", () => {
    mockUseCustomerSearch.mockReturnValue({ data: [], isFetching: true });
    mockUseCustomersByPlate.mockReturnValue({ data: [], isFetching: false });

    const { result } = renderHook(() => useCustomerSelection("org-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.customerSearching).toBe(true);
  });

  it("works with undefined orgId", () => {
    mockUseCustomerSearch.mockReturnValue({ data: [], isFetching: false });
    mockUseCustomersByPlate.mockReturnValue({ data: [], isFetching: false });

    const { result } = renderHook(() => useCustomerSelection(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.customerSearch).toBe("");
    expect(result.current.customers).toEqual([]);
    expect(result.current.selectedCustomer).toBeNull();
  });
});
