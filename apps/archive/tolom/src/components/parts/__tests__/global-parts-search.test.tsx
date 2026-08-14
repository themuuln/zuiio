import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GlobalPartsSearch } from "@/components/parts/global-parts-search";
import type { GlobalPartCatalog } from "@/lib/types";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations:
      (namespace: string) =>
      (key: string, params?: Record<string, string | number>) => {
        const messages: Record<string, Record<string, string>> = {
          globalCatalog: {
            searchPlaceholder: "Search global parts catalog...",
            searchPrompt: "Search for parts to import",
            noResults: "No parts found",
            resultsCount: `${params?.count ?? 0} parts found`,
            import: "Import",
            importing: "Importing...",
            importSuccess: `Imported ${params?.name ?? "part"}`,
          },
        };
        return messages[namespace]?.[key] ?? key;
      },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock SearchInput as a simple input that fires onSearch on Enter
vi.mock("@/components/search-input", () => ({
  SearchInput: ({
    onSearch,
    placeholder,
    loading,
  }: {
    onSearch: (q: string) => void;
    placeholder: string;
    loading?: boolean;
  }) => (
    <input
      placeholder={placeholder}
      data-loading={loading ? "true" : "false"}
      data-testid="search-input"
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onSearch(e.target.value)
      }
    />
  ),
}));

// ── Test data ──────────────────────────────────────────────────────────

const mockParts: GlobalPartCatalog[] = [
  {
    id: "part-1",
    name: "Oil Filter OF-101",
    name_mn: "Тосны шүүлтүүр OF-101",
    category: "Filters",
    part_number: "OF-101",
    unit_price: "15000",
  },
  {
    id: "part-2",
    name: "Brake Pad Set",
    name_mn: "Тормосны дэвсгэр",
    category: "Brakes",
    part_number: "BP-200",
    unit_price: "45000",
  },
  {
    id: "part-3",
    name: "Air Filter",
    category: "Filters",
    part_number: "AF-300",
    unit_price: "12000",
  },
] as GlobalPartCatalog[];

// ── Helpers ────────────────────────────────────────────────────────────

function renderSearch(props: Record<string, unknown> = {}) {
  return render(<GlobalPartsSearch orgId="test-org-id" {...props} />);
}

function getSearchInput(): HTMLInputElement {
  return screen.getByTestId("search-input") as HTMLInputElement;
}

async function triggerSearch(query: string) {
  fireEvent.change(getSearchInput(), { target: { value: query } });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("GlobalPartsSearch", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ── 1. Initial state ─────────────────────────────────────────────

  it("renders search input and shows search prompt initially", () => {
    renderSearch();

    expect(getSearchInput()).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search global parts catalog..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Search for parts to import")).toBeInTheDocument();
  });

  // ── 2. Loading state ──────────────────────────────────────────────

  it("shows loading spinner while searching", async () => {
    // Don't resolve fetch yet so loading persists
    fetchSpy.mockImplementationOnce(
      () =>
        new Promise<Response>(() => {
          /* never resolves during test */
        }),
    );

    renderSearch();
    await triggerSearch("oil");

    // The search input should show loading
    expect(getSearchInput()).toHaveAttribute("data-loading", "true");
  });

  // ── 3. Results state ──────────────────────────────────────────────

  it("shows results after search with part cards", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockParts }),
    } as Response);

    renderSearch();
    await triggerSearch("oil");

    await waitFor(() => {
      expect(screen.getByText("3 parts found")).toBeInTheDocument();
    });

    expect(screen.getByText("Oil Filter OF-101")).toBeInTheDocument();
    expect(screen.getByText("Brake Pad Set")).toBeInTheDocument();
    expect(screen.getByText("Air Filter")).toBeInTheDocument();

    // Category badges (Filter appears twice: Oil Filter + Air Filter)
    expect(screen.getAllByText("Filters")).toHaveLength(2);
    expect(screen.getByText("Brakes")).toBeInTheDocument();

    // Part numbers
    expect(screen.getByText("OF-101")).toBeInTheDocument();
    expect(screen.getByText("BP-200")).toBeInTheDocument();
    expect(screen.getByText("AF-300")).toBeInTheDocument();

    // Mongolian names
    expect(screen.getByText("Тосны шүүлтүүр OF-101")).toBeInTheDocument();
    expect(screen.getByText("Тормосны дэвсгэр")).toBeInTheDocument();

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/global-catalog/parts?q=oil&limit=20",
    );
  });

  // ── 4. Empty state ────────────────────────────────────────────────

  it("shows empty state with no results message when no parts found", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    renderSearch();
    await triggerSearch("nonexistent");

    await waitFor(() => {
      expect(screen.getByText("No parts found")).toBeInTheDocument();
    });

    // Search prompt should NOT be shown (only when no query)
    expect(
      screen.queryByText("Search for parts to import"),
    ).not.toBeInTheDocument();
  });

  // ── 5. Error state ────────────────────────────────────────────────

  it("shows error message when search fails", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { message: "Failed to search global catalog" },
        }),
    } as Response);

    renderSearch();
    await triggerSearch("oil");

    await waitFor(() => {
      expect(
        screen.getByText("Failed to search global catalog"),
      ).toBeInTheDocument();
    });
  });

  it("shows generic error message when fetch throws", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network error"));

    renderSearch();
    await triggerSearch("oil");

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  // ── 6. Import button ──────────────────────────────────────────────

  it("calls import API and shows importing state on import button click", async () => {
    fetchSpy
      // First call: search
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockParts[0]] }),
      } as Response)
      // Second call: import
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: "part-1" } }),
      } as Response);

    const onImported = vi.fn();
    renderSearch({ onImported });
    await triggerSearch("oil");

    await waitFor(() => {
      expect(screen.getByText("1 parts found")).toBeInTheDocument();
    });

    const importButton = screen.getByRole("button", { name: /import/i });
    expect(importButton).toBeInTheDocument();

    fireEvent.click(importButton);

    // Should show importing state
    expect(screen.getByText("Importing...")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/global-catalog/parts/import",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: "test-org-id",
            partIds: ["part-1"],
          }),
        }),
      );
    });

    // After import completes, button returns to Import label
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /import$/i }));
    });

    expect(onImported).toHaveBeenCalledTimes(1);
  });

  // ── 7. Multiple imports tracking ──────────────────────────────────

  it("tracks individual import states for multiple parts", async () => {
    fetchSpy
      // Search
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockParts.slice(0, 2) }),
      } as Response)
      // Import part-1 (slow, don't resolve)
      .mockImplementationOnce(
        () =>
          new Promise<Response>(() => {
            /* never resolves */
          }),
      )
      // Import part-2 (succeeds)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: "part-2" } }),
      } as Response);

    renderSearch();
    await triggerSearch("oil");

    await waitFor(() => {
      expect(screen.getByText("2 parts found")).toBeInTheDocument();
    });

    const importButtons = screen.getAllByRole("button", { name: /import/i });
    expect(importButtons).toHaveLength(2);

    // Click import on first part
    fireEvent.click(importButtons[0]);
    expect(screen.getByText("Importing...")).toBeInTheDocument();

    // Click import on second part
    fireEvent.click(importButtons[1]);

    // Verify import calls: part-1's import was made (hung), part-2's imported
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    expect(fetchSpy.mock.calls[1]).toEqual([
      "/api/global-catalog/parts/import",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          organizationId: "test-org-id",
          partIds: ["part-1"],
        }),
      }),
    ]);

    expect(fetchSpy.mock.calls[2]).toEqual([
      "/api/global-catalog/parts/import",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          organizationId: "test-org-id",
          partIds: ["part-2"],
        }),
      }),
    ]);

    // First part still shows Importing..., second part shows Import
    expect(screen.getByText("Importing...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
  });

  // ── 8. Empty query clears results ─────────────────────────────────

  it("clears results when query is emptied", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockParts }),
    } as Response);

    renderSearch();
    await triggerSearch("oil");

    await waitFor(() => {
      expect(screen.getByText("3 parts found")).toBeInTheDocument();
    });

    // Clear the search - empty query should reset results
    await triggerSearch("");

    await waitFor(() => {
      expect(screen.queryByText("3 parts found")).not.toBeInTheDocument();
    });

    // Search prompt should show again
    expect(screen.getByText("Search for parts to import")).toBeInTheDocument();
  });
});
