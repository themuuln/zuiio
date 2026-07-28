import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/app-sidebar";

const mockPush = vi.fn();

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "nav.dashboard": "Dashboard",
    };
    return map[key] ?? key;
  },
}));

// Mock i18n navigation
vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock useNavigation
vi.mock("@/hooks/use-navigation", () => ({
  useNavigation: () => ({
    isActive: () => false,
    groups: [],
    primaryItems: [],
    settingsItems: [],
    roleLoading: false,
  }),
}));

// Mock sidebar base
vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-slot="sidebar" {...props}>
      {children}
    </div>
  ),
  SidebarContent: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-slot="sidebar-content" {...props}>
      {children}
    </div>
  ),
  SidebarFooter: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-slot="sidebar-footer" {...props}>
      {children}
    </div>
  ),
  SidebarHeader: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-slot="sidebar-header" {...props}>
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
    ...props
  }: React.ComponentProps<"button">) => (
    <button data-slot="sidebar-menu-button" {...props}>
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children, ...props }: React.ComponentProps<"li">) => (
    <li data-slot="sidebar-menu-item" {...props}>
      {children}
    </li>
  ),
  SidebarRail: (props: React.ComponentProps<"div">) => (
    <div data-slot="sidebar-rail" {...props} />
  ),
}));

// Mock child components
vi.mock("@/components/team-switcher", () => ({
  TeamSwitcher: () => <div data-testid="team-switcher">TeamSwitcher</div>,
}));

vi.mock("@/components/nav-main", () => ({
  NavMain: () => <div data-testid="nav-main">NavMain</div>,
}));

vi.mock("@/components/nav-user", () => ({
  NavUser: () => <div data-testid="nav-user">NavUser</div>,
}));

vi.mock("@/components/nav-projects", () => ({
  NavProjects: () => <div data-testid="nav-projects">NavProjects</div>,
}));

vi.mock("@/components/mechanic-switcher", () => ({
  MechanicSwitcher: () => (
    <div data-testid="mechanic-switcher">MechanicSwitcher</div>
  ),
}));

describe("AppSidebar", () => {
  it("renders sidebar with data-slot", () => {
    const { container } = render(<AppSidebar />);
    expect(
      container.querySelector("[data-slot='sidebar']"),
    ).toBeInTheDocument();
  });

  it("renders TeamSwitcher", () => {
    render(<AppSidebar />);
    expect(screen.getByTestId("team-switcher")).toBeInTheDocument();
  });

  it("renders NavMain", () => {
    render(<AppSidebar />);
    expect(screen.getByTestId("nav-main")).toBeInTheDocument();
  });

  it("renders NavUser", () => {
    render(<AppSidebar />);
    expect(screen.getByTestId("nav-user")).toBeInTheDocument();
  });

  it("renders sidebar sections", () => {
    const { container } = render(<AppSidebar />);
    expect(
      container.querySelector("[data-slot='sidebar-header']"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='sidebar-content']"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='sidebar-footer']"),
    ).toBeInTheDocument();
  });
});
