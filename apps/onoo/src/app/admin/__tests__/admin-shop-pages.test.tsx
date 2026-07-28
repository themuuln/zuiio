/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════════
// Hoisted mocks — define vi.fn references that the vi.mock factories can capture
// ═══════════════════════════════════════════════════════════════════════════════

const mockUseQuery = vi.hoisted(() => vi.fn());
const mockUseMutation = vi.hoisted(() => vi.fn());
const mockUseQueryClient = vi.hoisted(() => vi.fn());
const mockUseEntityCrud = vi.hoisted(() => vi.fn());

// ═══════════════════════════════════════════════════════════════════════════════
// Mock Data
// ═══════════════════════════════════════════════════════════════════════════════

const mockReviews = [
  {
    id: "review-1",
    product_id: "prod-1",
    author_name: "Бат",
    rating: 5,
    content: "Маш сайн бүтээгдэхүүн",
    is_approved: true,
    created_at: "2024-01-15T10:00:00Z",
    products: { name: "Онооны самбар" },
  },
  {
    id: "review-2",
    product_id: "prod-2",
    author_name: "Сүхээ",
    rating: 3,
    content: "Дунд зэрэг",
    is_approved: false,
    created_at: "2024-02-20T14:30:00Z",
    products: { name: "Бөмбөг" },
  },
];

const mockBundles = [
  {
    id: "bundle-1",
    name: "Гарааны багц",
    description: "Шинэ тоглогчдод зориулсан багц",
    discount_percent: 15,
    is_active: true,
    created_at: "2024-01-10T00:00:00Z",
  },
  {
    id: "bundle-2",
    name: "Мэргэжлийн багц",
    description: null,
    discount_percent: 20,
    is_active: false,
    created_at: "2024-02-15T00:00:00Z",
  },
];

const mockShopProducts = [
  { id: "prod-1", name: "Онооны самбар", price_mnt: 50000 },
  { id: "prod-2", name: "Бөмбөг", price_mnt: 30000 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Shared Mocks
// ═══════════════════════════════════════════════════════════════════════════════

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = Icon;
  }
  return mocked;
});

vi.mock("@/components/admin/page-layout", () => ({
  AdminPageLayout: ({
    title,
    children,
    actions,
    loading,
    isEmpty,
    emptyTitle,
    emptyDescription,
  }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    loading?: boolean;
    isEmpty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
  }) => (
    <div>
      <div data-testid="page-title">{title}</div>
      {actions && <div data-testid="page-actions">{actions}</div>}
      {loading ? (
        <div data-testid="loading-spinner">Loading...</div>
      ) : isEmpty ? (
        <div data-testid="empty-state">
          <div data-testid="empty-title">{emptyTitle}</div>
          {emptyDescription && (
            <div data-testid="empty-description">{emptyDescription}</div>
          )}
        </div>
      ) : (
        <div data-testid="page-content">{children}</div>
      )}
    </div>
  ),
}));

vi.mock("@/components/admin/confirm-dialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({
    columns,
    data,
  }: {
    columns: Array<{ id?: string; accessorKey?: string; header: string }>;
    data: Array<Record<string, unknown>>;
  }) => (
    <table data-testid="data-table">
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={col.id ?? col.accessorKey ?? i}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={(row.id as string) ?? i}>
            {columns.map((col) => {
              const key = col.accessorKey ?? col.id;
              return key ? <td key={key}>{String(row[key] ?? "")}</td> : null;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormControl: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  FormField: ({
    render,
  }: {
    render: (fieldProps: {
      field: { value: unknown; onChange: () => void; name: string };
    }) => React.ReactNode;
  }) =>
    render({
      field: { value: "", onChange: vi.fn(), name: "" },
    }),
  FormItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  FormLabel: ({ children }: { children: React.ReactNode }) => (
    <label>{children}</label>
  ),
  FormMessage: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Mock @tanstack/react-query — uses hoisted vi.fn() so per-test overrides work
// ═══════════════════════════════════════════════════════════════════════════════

vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: mockUseQueryClient,
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Mock API module
// ═══════════════════════════════════════════════════════════════════════════════

vi.mock("@/app/admin/_lib/api", () => ({
  shopReviewsApi: {
    list: vi.fn(() => Promise.resolve(mockReviews)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  shopBundlesApi: {
    list: vi.fn(() => Promise.resolve(mockBundles)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  shopProductsApi: {
    list: vi.fn(() => Promise.resolve(mockShopProducts)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Mock useEntityCrud — uses hoisted vi.fn() so per-test overrides are possible
// ═══════════════════════════════════════════════════════════════════════════════

vi.mock("@/hooks/use-entity-crud", () => ({
  useEntityCrud: mockUseEntityCrud,
}));

// ═══════════════════════════════════════════════════════════════════════════════
// Page Imports (after mocks — vitest hoists vi.mock above all imports)
// ═══════════════════════════════════════════════════════════════════════════════

import AdminReviewsPage from "../reviews/page";
import AdminBundlesPage from "../bundles/page";
import { shopReviewsApi, shopBundlesApi } from "@/app/admin/_lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

const defaultCrudMock = {
  dialogOpen: false,
  editingItem: null,
  confirmOpen: false,
  confirmMessage: "",
  confirmLoading: false,
  form: {
    control: {},
    getValues: vi.fn(() => "[]"),
    setValue: vi.fn(),
    watch: vi.fn((name: string) => {
      if (name === "discount_percent") return 0;
      return "";
    }),
    handleSubmit: () => vi.fn(),
    formState: { errors: {} },
  },
  handleCreate: vi.fn(),
  handleEdit: vi.fn(),
  handleDelete: vi.fn(),
  handleSubmit: vi.fn(),
  handleDialogOpenChange: vi.fn(),
  handleConfirmOpenChange: vi.fn(),
  handleConfirmDelete: vi.fn(),
  isMutating: false,
};

/**
 * Set default useQuery mock implementation.
 * Handles all query keys used in reviews and bundles pages.
 */
function setupDefaultQueryMocks() {
  mockUseQuery.mockReset();
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    const [ns, entity, sub] = queryKey as string[];
    if (ns === "admin") {
      if (entity === "reviews") {
        return { data: mockReviews, isPending: false };
      }
      if (entity === "bundles") {
        return { data: mockBundles, isPending: false };
      }
      if (entity === "products") {
        return { data: mockShopProducts, isPending: false };
      }
      if (entity === "bundle-items" && sub) {
        return { data: [{ product_id: "prod-1" }], isPending: false };
      }
    }
    return { data: [], isPending: false };
  });
}

/**
 * Set default useMutation mock so that mutationFn actually executes,
 * enabling interaction tests to verify API calls and toast callbacks.
 */
function setupDefaultMutationMock() {
  mockUseMutation.mockReset();
  mockUseMutation.mockImplementation(
    ({
      mutationFn,
      onSuccess,
      onError,
    }: {
      mutationFn: (...args: unknown[]) => Promise<unknown>;
      onSuccess?: (data: unknown) => void;
      onError?: (error: unknown) => void;
    }) => ({
      isPending: false,
      mutate: async (...args: unknown[]) => {
        try {
          const result = await mutationFn(...args);
          if (onSuccess) onSuccess(result);
        } catch (e) {
          if (onError) onError(e);
        }
      },
      mutateAsync: async (...args: unknown[]) => {
        try {
          const result = await mutationFn(...args);
          if (onSuccess) onSuccess(result);
          return result;
        } catch (e) {
          if (onError) onError(e);
          throw e;
        }
      },
    }),
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests — AdminReviewsPage
// ═══════════════════════════════════════════════════════════════════════════════

describe("AdminReviewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultQueryMocks();
    setupDefaultMutationMock();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn(),
    });
    mockUseEntityCrud.mockReturnValue(defaultCrudMock);
  });

  // ── Render states ────────────────────────────────────────────────────────

  it("shows the page title", () => {
    render(<AdminReviewsPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Сэтгэгдэл");
  });

  it("shows loading spinner when data is loading", () => {
    mockUseQuery.mockReturnValueOnce({
      data: undefined,
      isPending: true,
    });
    render(<AdminReviewsPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows empty state when there are no reviews", () => {
    mockUseQuery.mockReturnValueOnce({
      data: [],
      isPending: false,
    });
    render(<AdminReviewsPage />);
    expect(
      screen.getByText("Сэтгэгдэл байхгүй байна"),
    ).toBeInTheDocument();
  });

  it("renders review rows with author_name, rating stars, and content", () => {
    render(<AdminReviewsPage />);
    expect(screen.getByText("Бат")).toBeInTheDocument();
    expect(screen.getByText("Сүхээ")).toBeInTheDocument();
    expect(screen.getByText("Маш сайн бүтээгдэхүүн")).toBeInTheDocument();
    expect(screen.getByText("Дунд зэрэг")).toBeInTheDocument();
  });

  it("shows 'Баталгаажсан' green badge when is_approved is true", () => {
    render(<AdminReviewsPage />);
    expect(screen.getByText("Баталгаажсан")).toBeInTheDocument();
  });

  it("shows 'Хүлээгдэж буй' yellow badge when is_approved is false", () => {
    render(<AdminReviewsPage />);
    expect(screen.getByText("Хүлээгдэж буй")).toBeInTheDocument();
  });

  it("shows product name from products relationship", () => {
    render(<AdminReviewsPage />);
    expect(screen.getByText("Онооны самбар")).toBeInTheDocument();
    expect(screen.getByText("Бөмбөг")).toBeInTheDocument();
  });

  it("shows formatted date", () => {
    render(<AdminReviewsPage />);
    // "2024-01-15 10:00" — formatted via format() from date-fns
    expect(screen.getByText("2024-01-15 10:00")).toBeInTheDocument();
    expect(screen.getByText("2024-02-20 14:30")).toBeInTheDocument();
  });

  it("shows Зөвшөөрөх button for unapproved reviews", () => {
    render(<AdminReviewsPage />);
    const approveButtons = screen.getAllByText("Зөвшөөрөх");
    expect(approveButtons).toHaveLength(1);
  });

  it("shows Цуцлах button for approved reviews", () => {
    render(<AdminReviewsPage />);
    const rejectButtons = screen.getAllByText("Цуцлах");
    expect(rejectButtons).toHaveLength(1);
  });

  it("shows delete (Trash2) button for each review", () => {
    render(<AdminReviewsPage />);
    // Each row has a Тrash2 icon button with title "Устгах"
    const deleteButtons = screen.getAllByTitle("Устгах");
    expect(deleteButtons).toHaveLength(2);
  });

  // ── Interaction tests ────────────────────────────────────────────────────

  it("clicking Зөвшөөрөх calls shopReviewsApi.update with is_approved:true", async () => {
    const updateMock = vi.mocked(shopReviewsApi.update);
    updateMock.mockResolvedValue(mockReviews[1]);
    render(<AdminReviewsPage />);
    const approveBtn = screen.getByText("Зөвшөөрөх");
    fireEvent.click(approveBtn);
    await vi.waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith("review-2", {
        is_approved: true,
      });
    });
  });

  it("clicking Цуцлах calls shopReviewsApi.update with is_approved:false", async () => {
    const updateMock = vi.mocked(shopReviewsApi.update);
    updateMock.mockResolvedValue(mockReviews[0]);
    render(<AdminReviewsPage />);
    const rejectBtn = screen.getByText("Цуцлах");
    fireEvent.click(rejectBtn);
    await vi.waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith("review-1", {
        is_approved: false,
      });
    });
  });

  it("clicking Trash2 calls shopReviewsApi.remove", async () => {
    const removeMock = vi.mocked(shopReviewsApi.remove);
    removeMock.mockResolvedValue();
    render(<AdminReviewsPage />);
    const deleteButtons = screen.getAllByTitle("Устгах");
    fireEvent.click(deleteButtons[0]);
    await vi.waitFor(() => {
      expect(removeMock).toHaveBeenCalledWith("review-1");
    });
  });

  it("shows success toast on approve", async () => {
    const updateMock = vi.mocked(shopReviewsApi.update);
    updateMock.mockResolvedValue(mockReviews[1]);
    render(<AdminReviewsPage />);
    fireEvent.click(screen.getByText("Зөвшөөрөх"));
    await vi.waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Сэтгэгдэл баталгаажсан");
    });
  });

  it("shows success toast on reject", async () => {
    const updateMock = vi.mocked(shopReviewsApi.update);
    updateMock.mockResolvedValue(mockReviews[0]);
    render(<AdminReviewsPage />);
    fireEvent.click(screen.getByText("Цуцлах"));
    await vi.waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Сэтгэгдэл цуцлагдсан");
    });
  });

  it("shows success toast on delete", async () => {
    const removeMock = vi.mocked(shopReviewsApi.remove);
    removeMock.mockResolvedValue();
    render(<AdminReviewsPage />);
    fireEvent.click(screen.getAllByTitle("Устгах")[0]);
    await vi.waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Сэтгэгдэл устгагдлаа");
    });
  });

  it("shows error toast when approve mutation fails", async () => {
    const updateMock = vi.mocked(shopReviewsApi.update);
    updateMock.mockRejectedValue(new Error("API error"));
    render(<AdminReviewsPage />);
    fireEvent.click(screen.getByText("Зөвшөөрөх"));
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Алдаа гарлаа");
    });
  });

  it("shows error toast when reject mutation fails", async () => {
    const updateMock = vi.mocked(shopReviewsApi.update);
    updateMock.mockRejectedValue(new Error("API error"));
    render(<AdminReviewsPage />);
    fireEvent.click(screen.getByText("Цуцлах"));
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Алдаа гарлаа");
    });
  });

  it("shows error toast when delete mutation fails", async () => {
    const removeMock = vi.mocked(shopReviewsApi.remove);
    removeMock.mockRejectedValue(new Error("API error"));
    render(<AdminReviewsPage />);
    fireEvent.click(screen.getAllByTitle("Устгах")[0]);
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Алдаа гарлаа");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Tests — AdminBundlesPage
// ═══════════════════════════════════════════════════════════════════════════════

describe("AdminBundlesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultQueryMocks();
    setupDefaultMutationMock();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn(),
    });
    mockUseEntityCrud.mockReturnValue({ ...defaultCrudMock });
  });

  // ── Render states ────────────────────────────────────────────────────────

  it("shows the page title", () => {
    render(<AdminBundlesPage />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Багц");
  });

  it("shows loading state", () => {
    // Override the bundles query to return loading
    mockUseQuery.mockImplementation(
      ({ queryKey }: { queryKey: unknown[] }) => {
        const [ns, entity] = queryKey as string[];
        if (ns === "admin" && entity === "bundles") {
          return { data: undefined, isPending: true };
        }
        // Keep other queries (products, bundle-items) returning normal data
        if (ns === "admin" && entity === "products") {
          return { data: mockShopProducts, isPending: false };
        }
        return { data: [], isPending: false };
      },
    );
    render(<AdminBundlesPage />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    mockUseQuery.mockImplementation(
      ({ queryKey }: { queryKey: unknown[] }) => {
        const [ns, entity] = queryKey as string[];
        if (ns === "admin" && entity === "bundles") {
          return { data: [], isPending: false };
        }
        if (ns === "admin" && entity === "products") {
          return { data: mockShopProducts, isPending: false };
        }
        return { data: [], isPending: false };
      },
    );
    render(<AdminBundlesPage />);
    // AdminPageLayout displays empty state via isEmpty prop
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("empty-title")).toHaveTextContent(
      "Багц байхгүй байна",
    );
  });

  it("renders bundle rows with name", () => {
    render(<AdminBundlesPage />);
    expect(screen.getByText("Гарааны багц")).toBeInTheDocument();
    expect(screen.getByText("Мэргэжлийн багц")).toBeInTheDocument();
  });

  it("renders bundle discount_percent values", () => {
    render(<AdminBundlesPage />);
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders is_active values via DataTable", () => {
    render(<AdminBundlesPage />);
    // DataTable mock renders raw cell text from accessorKey
    expect(screen.getByText("true")).toBeInTheDocument();
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("shows Шинэ багц button", () => {
    render(<AdminBundlesPage />);
    expect(screen.getByText("Шинэ багц")).toBeInTheDocument();
  });

  it("renders edit buttons", () => {
    render(<AdminBundlesPage />);
    const editButtons = screen.getAllByTitle("Засах");
    expect(editButtons).toHaveLength(2);
  });

  it("renders delete buttons", () => {
    render(<AdminBundlesPage />);
    const deleteButtons = screen.getAllByTitle("Устгах");
    expect(deleteButtons).toHaveLength(2);
  });

  // ── Dialog tests ─────────────────────────────────────────────────────────

  it("clicking Шинэ багц calls crud.handleCreate", () => {
    const crudMock = {
      ...defaultCrudMock,
      handleCreate: vi.fn(),
    };
    mockUseEntityCrud.mockReturnValue(crudMock);
    render(<AdminBundlesPage />);
    fireEvent.click(screen.getByText("Шинэ багц"));
    expect(crudMock.handleCreate).toHaveBeenCalled();
  });

  it("dialog shows form fields: name, description, discount_percent", () => {
    const crudMock = {
      ...defaultCrudMock,
      dialogOpen: true,
    };
    mockUseEntityCrud.mockReturnValue(crudMock);
    render(<AdminBundlesPage />);
    expect(screen.getByText("Нэр")).toBeInTheDocument();
    expect(screen.getByText("Тайлбар")).toBeInTheDocument();
    expect(screen.getByText("Хямдрал (%)")).toBeInTheDocument();
  });

  it("dialog shows product multi-select checkboxes", () => {
    const crudMock = {
      ...defaultCrudMock,
      dialogOpen: true,
    };
    mockUseEntityCrud.mockReturnValue(crudMock);
    render(<AdminBundlesPage />);
    // Dialog renders product section heading
    expect(screen.getByText("Бүтээгдэхүүнүүд")).toBeInTheDocument();
    // Product names are visible
    expect(screen.getByText("Онооны самбар")).toBeInTheDocument();
    expect(screen.getByText("Бөмбөг")).toBeInTheDocument();
  });

  it("dialog shows pricing calculation (total original vs discounted)", () => {
    const crudMock = {
      ...defaultCrudMock,
      dialogOpen: true,
    };
    mockUseEntityCrud.mockReturnValue(crudMock);
    render(<AdminBundlesPage />);
    // Pricing labels are visible when products are selected
    expect(screen.getByText("Анхны үнэ:")).toBeInTheDocument();
    expect(screen.getByText("Хямдралтай үнэ:")).toBeInTheDocument();
  });

  it("dialog shows Цуцлах and Үүсгэх buttons", () => {
    const crudMock = {
      ...defaultCrudMock,
      dialogOpen: true,
    };
    mockUseEntityCrud.mockReturnValue(crudMock);
    render(<AdminBundlesPage />);
    expect(screen.getByText("Цуцлах")).toBeInTheDocument();
    expect(screen.getByText("Үүсгэх")).toBeInTheDocument();
  });

  it("edit dialog shows Шинэчлэх button", () => {
    const crudMock = {
      ...defaultCrudMock,
      dialogOpen: true,
      editingItem: mockBundles[0],
    };
    mockUseEntityCrud.mockReturnValue(crudMock);
    render(<AdminBundlesPage />);
    expect(screen.getByText("Шинэчлэх")).toBeInTheDocument();
  });

  it("clicking delete button opens confirm dialog", () => {
    const handleDelete = vi.fn();
    const crudMock = {
      ...defaultCrudMock,
      handleDelete,
    };
    mockUseEntityCrud.mockReturnValue(crudMock);
    render(<AdminBundlesPage />);
    const deleteButtons = screen.getAllByTitle("Устгах");
    fireEvent.click(deleteButtons[0]);
    expect(handleDelete).toHaveBeenCalledWith(
      mockBundles[0],
      "Багцыг устгах уу?",
    );
  });

  it("clicking edit button calls handleEdit with the bundle", () => {
    const handleEdit = vi.fn();
    const crudMock = {
      ...defaultCrudMock,
      handleEdit,
    };
    mockUseEntityCrud.mockReturnValue(crudMock);
    render(<AdminBundlesPage />);
    const editButtons = screen.getAllByTitle("Засах");
    fireEvent.click(editButtons[0]);
    expect(handleEdit).toHaveBeenCalledWith(mockBundles[0]);
  });
});
