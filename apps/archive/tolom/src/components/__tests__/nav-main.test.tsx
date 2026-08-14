import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavMain } from "@/components/nav-main";

// Mock ViewTransition
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "nav.dashboard": "Dashboard",
    };
    return map[key] ?? key;
  },
}));

// Mock sidebar components
vi.mock("@/components/ui/sidebar", () => ({
  SidebarGroup: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-slot="sidebar-group" {...props}>
      {children}
    </div>
  ),
  SidebarGroupContent: ({
    children,
    ...props
  }: React.ComponentProps<"div">) => (
    <div data-slot="sidebar-group-content" {...props}>
      {children}
    </div>
  ),
  SidebarGroupLabel: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-slot="sidebar-group-label" {...props}>
      {children}
    </div>
  ),
  SidebarMenu: ({ children, ...props }: React.ComponentProps<"nav">) => (
    <nav data-slot="sidebar-menu" {...props}>
      {children}
    </nav>
  ),
  SidebarMenuButton: ({
    children,
    isActive,
    tooltip,
    onClick,
    ...props
  }: React.ComponentProps<"button"> & {
    isActive?: boolean;
    tooltip?: string;
  }) => (
    <button
      data-slot="sidebar-menu-button"
      data-active={isActive ? "true" : "false"}
      data-tooltip={tooltip}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children, ...props }: React.ComponentProps<"li">) => (
    <li data-slot="sidebar-menu-item" {...props}>
      {children}
    </li>
  ),
}));

// Mock collapsible
vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-slot="collapsible" {...props}>
      {children}
    </div>
  ),
  CollapsibleContent: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-slot="collapsible-content" {...props}>
      {children}
    </div>
  ),
  CollapsibleTrigger: ({
    children,
    ...props
  }: React.ComponentProps<"button">) => (
    <button data-slot="collapsible-trigger" {...props}>
      {children}
    </button>
  ),
}));

// Mock prefetch
vi.mock("@/lib/prefetch", () => ({
  onLinkHover: () => () => {},
}));

describe("NavMain", () => {
  const primaryItems = [
    { labelKey: "nav.dashboard", href: "/", icon: (() => <svg />) as never },
  ];

  it("renders primary items", () => {
    render(
      <NavMain
        primaryItems={primaryItems}
        groups={[]}
        isActive={() => false}
        onNavigate={() => {}}
      />,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
