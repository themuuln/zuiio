// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateBrowser } from "./TemplateBrowser";
import type { Template } from "@/types/template";

// Mock the Sheet component from @base-ui/react/dialog since it has portal/overlay
// complexities that don't work well in jsdom test environment.
// We test the core logic: data fetching, state rendering, tab filtering.
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
  }) => (open ? <div data-testid="sheet-root">{children}</div> : null),
  SheetContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div data-testid="sheet-content" className={className}>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="sheet-title">{children}</h2>
  ),
  SheetDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="sheet-description">{children}</p>
  ),
}));

const mockTemplates: Template[] = [
  {
    id: "t1",
    name: "Welcome Greeting",
    description: "A friendly welcome message for new subscribers",
    category: "welcome",
    channels: ["messenger"],
    flow_json: { nodes: [], edges: [] },
    is_builtin: true,
    usageCount: 42,
    userId: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "t2",
    name: "FAQ Bot",
    description: "Automated FAQ responses",
    category: "support",
    channels: ["messenger"],
    flow_json: { nodes: [], edges: [] },
    is_builtin: true,
    usageCount: 15,
    userId: null,
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "t3",
    name: "Sales Pitch",
    description: "Product promotion sequence",
    category: "sales",
    channels: ["messenger"],
    flow_json: { nodes: [], edges: [] },
    is_builtin: true,
    usageCount: 8,
    userId: null,
    createdAt: "2026-01-03T00:00:00Z",
    updatedAt: "2026-01-03T00:00:00Z",
  },
];

const mockEmptyTemplates: Template[] = [];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("TemplateBrowser", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onUseTemplate: vi.fn(),
  };

  it("renders the sheet with title and description when open", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ templates: mockTemplates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<TemplateBrowser {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("sheet-root")).toBeDefined();
    });

    expect(screen.getByTestId("sheet-title")?.textContent).toBe(
      "Template Library",
    );
    expect(screen.getByTestId("sheet-description")?.textContent).toContain(
      "Browse pre-built templates",
    );
  });

  it("shows loading skeletons while fetching templates", async () => {
    // Never resolve the fetch to keep loading state
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>(() => {}), // never resolves
    );

    render(<TemplateBrowser {...defaultProps} />);

    // Wait for the setTimeout(fn, 0) to fire inside the component
    await new Promise((r) => setTimeout(r, 10));

    // Should show skeleton elements during loading
    await waitFor(() => {
      expect(screen.getByText("Template Library")).toBeDefined();
    });

    // Check for skeleton elements (the loading state renders animated pulse divs)
    const skeletonElements = document.querySelectorAll(".animate-pulse");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("renders template cards after successful fetch", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ templates: mockTemplates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<TemplateBrowser {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Welcome Greeting")).toBeDefined();
      expect(screen.getByText("FAQ Bot")).toBeDefined();
      expect(screen.getByText("Sales Pitch")).toBeDefined();
    });

    expect(
      screen.getByText(
        "A friendly welcome message for new subscribers",
      ),
    ).toBeDefined();
    expect(screen.getByText("Used 42 times")).toBeDefined();
    expect(screen.getByText("Used 15 times")).toBeDefined();
    expect(screen.getByText("Used 8 times")).toBeDefined();
  });

  it("renders all category tabs", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ templates: mockTemplates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<TemplateBrowser {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Welcome")).toBeDefined();
      expect(screen.getByText("Support")).toBeDefined();
      expect(screen.getByText("Sales")).toBeDefined();
      expect(screen.getByText("Notifications")).toBeDefined();
      expect(screen.getByText("General")).toBeDefined();
    });
  });

  it("shows empty state when no templates match the filter", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ templates: mockEmptyTemplates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<TemplateBrowser {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("No templates yet")).toBeDefined();
    });
    expect(
      screen.getByText(
        "Templates will appear here once created.",
      ),
    ).toBeDefined();
  });

  it("shows empty state for specific category when no templates match", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ templates: mockTemplates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<TemplateBrowser {...defaultProps} />);

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText("Welcome Greeting")).toBeDefined();
    });

    // Click "Notifications" tab - no templates have this category
    const notificationsTab = screen.getByText("Notifications");
    await userEvent.click(notificationsTab);

    await waitFor(() => {
      expect(
        screen.getByText("No Notifications templates"),
      ).toBeDefined();
    });
    expect(
      screen.getByText("No templates found in this category."),
    ).toBeDefined();
  });

  it("shows error state with retry button on fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    render(<TemplateBrowser {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load templates"),
      ).toBeDefined();
    });

    expect(screen.getByText("Network error")).toBeDefined();
    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeDefined();
  });

  it("calls onUseTemplate when Use Template button is clicked", async () => {
    const onUseTemplate = vi.fn();

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ templates: mockTemplates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <TemplateBrowser
        {...defaultProps}
        onUseTemplate={onUseTemplate}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Welcome Greeting")).toBeDefined();
    });

    const useButtons = screen.getAllByText("Use Template");
    await userEvent.click(useButtons[0]);

    expect(onUseTemplate).toHaveBeenCalledTimes(1);
    expect(onUseTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1", name: "Welcome Greeting" }),
    );
  });

  it("renders nothing when closed", () => {
    render(
      <TemplateBrowser
        open={false}
        onOpenChange={vi.fn()}
        onUseTemplate={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("sheet-root")).toBeNull();
  });

  it("displays template count", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ templates: mockTemplates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<TemplateBrowser {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("3 templates")).toBeDefined();
    });
  });
});
