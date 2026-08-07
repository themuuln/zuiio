/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Shared Mocks ──────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/admin/reviews"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) mocked[key] = Icon;
  return mocked;
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── UI Component Mocks ────────────────────────────────────────────────────────

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
          <p>{emptyTitle}</p>
          <p>{emptyDescription}</p>
        </div>
      ) : (
        <div data-testid="page-content">{children}</div>
      )}
    </div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/data-table", () => ({
  DataTable: <T,>({
    columns,
    data,
  }: {
    columns: Array<{
      accessorKey?: string;
      id?: string;
      header: string;
      cell?: (props: { row: { original: T } }) => React.ReactNode;
    }>;
    data: T[];
  }) => (
    <div data-testid="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.accessorKey ?? col.id ?? col.header}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={(row as { id?: string }).id ?? idx}
              data-testid="table-row"
            >
              {columns.map((col) => (
                <td key={col.accessorKey ?? col.id ?? col.header}>
                  {col.cell
                    ? col.cell({ row: { original: row } })
                    : col.accessorKey
                      ? String(
                          (row as Record<string, unknown>)[col.accessorKey] ??
                            "",
                        )
                      : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => (
    <input data-testid="input" {...props} />
  ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: Record<string, unknown>) => (
    <textarea data-testid="textarea" {...props} />
  ),
}));

vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: { children: React.ReactNode }) => (
    <form data-testid="form">{children}</form>
  ),
  FormControl: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormField: ({
    children,
    render,
  }: {
    children?: React.ReactNode;
    render?: (props: { field: Record<string, unknown> }) => React.ReactNode;
  }) => (
    <div data-testid="form-field">
      {render ? render({ field: {} }) : children}
    </div>
  ),
  FormItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-item">{children}</div>
  ),
  FormLabel: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => (
    <label data-testid="form-label" htmlFor={htmlFor}>
      {children}
    </label>
  ),
  FormMessage: () => <div data-testid="form-message" />,
}));

vi.mock("@/components/admin/confirm-dialog", () => ({
  ConfirmDialog: () => null,
}));

// ── Mock @tanstack/react-query ───────────────────────────────────────────────

const mockQueryData: Record<string, unknown> = {};

vi.mock("@tanstack/react-query", () => {
  const queryClient = {
    invalidateQueries: vi.fn(),
  };

  return {
    useQuery: vi.fn(
      ({ queryKey, enabled }: { queryKey: string[]; enabled?: boolean }) => {
        if (enabled === false) return { data: undefined, isLoading: false };
        const key = queryKey.join(":");
        const data = mockQueryData[key] ?? undefined;
        return {
          data: typeof data === "function" ? data() : data,
          isLoading: data === undefined,
          refetch: vi.fn(),
        };
      },
    ),
    useMutation: vi.fn(
      ({
        mutationFn,
        onSuccess,
        onError,
      }: {
        mutationFn: (...args: unknown[]) => unknown;
        onSuccess?: () => void;
        onError?: () => void;
      }) => {
        return {
          mutate: vi.fn(async (...args: unknown[]) => {
            try {
              await mutationFn(...args);
              onSuccess?.();
            } catch {
              onError?.();
            }
          }),
          mutateAsync: vi.fn(),
          isPending: false,
        };
      },
    ),
    useQueryClient: vi.fn(() => queryClient),
  };
});

// ── Mock API module ──────────────────────────────────────────────────────────

vi.mock("@/app/admin/_lib/api", () => ({
  shopReviewsApi: {
    list: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  shopBundlesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  shopProductsApi: {
    list: vi.fn(),
  },
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockReviews = [
  {
    id: "rev-1",
    product_id: "prod-1",
    author_name: "Бат",
    rating: 5,
    content: "Маш сайн бүтээгдэхүүн",
    is_approved: true,
    created_at: "2026-07-01T10:00:00Z",
    products: { name: "Onoo T-Shirt" },
  },
  {
    id: "rev-2",
    product_id: "prod-2",
    author_name: "Дорж",
    rating: 3,
    content: "Дунд зэрэг",
    is_approved: false,
    created_at: "2026-07-02T10:00:00Z",
    products: { name: "Onoo Cap" },
  },
];

const mockBundles = [
  {
    id: "bundle-1",
    name: "Onoo Starter Pack",
    description: "Хямдралтай багц",
    discount_percent: 15,
    is_active: true,
    created_at: "2026-07-01T00:00:00Z",
  },
];

const mockProducts = [
  {
    id: "prod-1",
    name: "T-Shirt",
    slug: "t-shirt",
    price_mnt: 35000,
    images: [],
    variants: [],
    is_available: true,
    created_at: "",
    updated_at: "",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("AdminReviewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryData["admin:reviews"] = mockReviews;
  });

  it("renders page title", async () => {
    const Page = (await import("../reviews/page")).default;
    render(<Page />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Сэтгэгдэл");
  });

  it("shows loading state", async () => {
    mockQueryData["admin:reviews"] = undefined;
    const Page = (await import("../reviews/page")).default;
    render(<Page />);
    // Reviews page renders its own spinner when data is undefined
    const spinners = screen.getAllByTestId("icon");
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockQueryData["admin:reviews"] = [];
    const Page = (await import("../reviews/page")).default;
    render(<Page />);
    expect(screen.getByText("Сэтгэгдэл байхгүй байна")).toBeInTheDocument();
  });

  it("renders review rows with author names", async () => {
    const Page = (await import("../reviews/page")).default;
    render(<Page />);
    expect(screen.getByText("Бат")).toBeInTheDocument();
    expect(screen.getByText("Дорж")).toBeInTheDocument();
  });

  it("shows product names from relationship", async () => {
    const Page = (await import("../reviews/page")).default;
    render(<Page />);
    expect(screen.getByText("Onoo T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Onoo Cap")).toBeInTheDocument();
  });

  it("shows approved badge for approved reviews", async () => {
    const Page = (await import("../reviews/page")).default;
    render(<Page />);
    expect(screen.getByText("Баталгаажсан")).toBeInTheDocument();
  });

  it("shows pending badge for unapproved reviews", async () => {
    const Page = (await import("../reviews/page")).default;
    render(<Page />);
    expect(screen.getByText("Хүлээгдэж буй")).toBeInTheDocument();
  });

  it("shows review content", async () => {
    const Page = (await import("../reviews/page")).default;
    render(<Page />);
    expect(screen.getByText("Маш сайн бүтээгдэхүүн")).toBeInTheDocument();
  });
});

describe("AdminBundlesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryData["admin:bundles"] = mockBundles;
    mockQueryData["admin:products"] = mockProducts;
  });

  it("renders page title", async () => {
    const Page = (await import("../bundles/page")).default;
    render(<Page />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Багц");
  });

  it("shows create button", async () => {
    const Page = (await import("../bundles/page")).default;
    render(<Page />);
    expect(screen.getByText("Шинэ багц")).toBeInTheDocument();
  });

  it("renders bundle rows with name", async () => {
    const Page = (await import("../bundles/page")).default;
    render(<Page />);
    expect(screen.getByText("Onoo Starter Pack")).toBeInTheDocument();
  });

  it("shows discount percentage", async () => {
    const Page = (await import("../bundles/page")).default;
    render(<Page />);
    expect(screen.getByText("15%")).toBeInTheDocument();
  });

  it("shows active badge for active bundles", async () => {
    const Page = (await import("../bundles/page")).default;
    render(<Page />);
    expect(screen.getByText("Идэвхтэй")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockQueryData["admin:bundles"] = [];
    const Page = (await import("../bundles/page")).default;
    render(<Page />);
    expect(screen.getByText("Багц байхгүй байна")).toBeInTheDocument();
  });
});
