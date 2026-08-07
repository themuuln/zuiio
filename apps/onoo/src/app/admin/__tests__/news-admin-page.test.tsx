/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Shared Mocks ──────────────────────────────────────────────────────────────

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
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button
      data-testid="button"
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

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select">{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-item">{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: () => <span data-testid="select-value" />,
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
      }) => ({
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
      }),
    ),
    useQueryClient: vi.fn(() => queryClient),
  };
});

// ── Mock API module ──────────────────────────────────────────────────────────

vi.mock("@/app/admin/_lib/api-news", () => ({
  newsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockArticles = [
  {
    id: "news-1",
    title: "Улирлын нээлтийн тоглолт",
    excerpt: "Хүрээлэн буй орчны товч агуулга",
    body: "Бүрэн агуулга",
    cover_image_url: null,
    published: true,
    status: "published",
    published_at: "2026-08-05T10:00:00Z",
    created_at: "2026-08-05T09:00:00Z",
    updated_at: "2026-08-05T09:00:00Z",
    created_by: null,
  },
  {
    id: "news-2",
    title: "Залуучуудын лиг эхэллээ",
    excerpt: null,
    body: "Тэмцээний дэлгэрэнгүй",
    cover_image_url: null,
    published: false,
    status: "draft",
    published_at: null,
    created_at: "2026-08-06T09:00:00Z",
    updated_at: "2026-08-06T09:00:00Z",
    created_by: null,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("AdminNewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryData["admin:news"] = mockArticles;
  });

  it("renders page title", async () => {
    const Page = (await import("../news/page")).default;
    render(<Page />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Мэдээ");
  });

  it("renders article rows with titles and excerpts", async () => {
    const Page = (await import("../news/page")).default;
    render(<Page />);
    expect(screen.getByText("Улирлын нээлтийн тоглолт")).toBeInTheDocument();
    expect(screen.getByText("Залуучуудын лиг эхэллээ")).toBeInTheDocument();
    expect(
      screen.getByText("Хүрээлэн буй орчны товч агуулга"),
    ).toBeInTheDocument();
  });

  it("shows published badge for published articles", async () => {
    const Page = (await import("../news/page")).default;
    render(<Page />);
    expect(screen.getByText("Нийтэлсэн")).toBeInTheDocument();
  });

  it("shows draft badge for unpublished articles", async () => {
    const Page = (await import("../news/page")).default;
    render(<Page />);
    expect(screen.getByText("Ноорог")).toBeInTheDocument();
  });

  it("shows empty state when no articles", async () => {
    mockQueryData["admin:news"] = [];
    const Page = (await import("../news/page")).default;
    render(<Page />);
    expect(screen.getByText("Мэдээ байхгүй байна")).toBeInTheDocument();
  });

  it("opens create dialog from the action button", async () => {
    const Page = (await import("../news/page")).default;
    render(<Page />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    screen.getByText("Шинэ мэдээ").click();
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Шинэ мэдээ");
  });

  it("opens edit dialog with edit title", async () => {
    const Page = (await import("../news/page")).default;
    render(<Page />);
    screen.getAllByTitle("Засах")[0]!.click();
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Мэдээ засах");
  });
});
