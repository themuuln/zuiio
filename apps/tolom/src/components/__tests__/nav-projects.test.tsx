import { fireEvent, render, screen } from "@testing-library/react";
import { Home, Settings } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { NavProjects } from "@/components/nav-projects";

// Mock ViewTransition from react (not available in React 19.2.7)
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
      "nav.home": "Home",
      "nav.settings": "Settings",
    };
    return map[key] ?? key;
  },
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Home: () => <svg data-testid="home-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
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

// Mock prefetch
vi.mock("@/lib/prefetch", () => ({
  onLinkHover: () => () => {},
}));

describe("NavProjects", () => {
  const items = [
    { labelKey: "nav.home", href: "/", icon: Home },
    { labelKey: "nav.settings", href: "/settings", icon: Settings },
  ];

  it("renders sidebar group", () => {
    const { container } = render(
      <NavProjects
        items={items}
        isActive={() => false}
        onNavigate={() => {}}
      />,
    );
    expect(
      container.querySelector("[data-slot='sidebar-group']"),
    ).toBeInTheDocument();
  });

  it("renders menu items", () => {
    render(
      <NavProjects
        items={items}
        isActive={() => false}
        onNavigate={() => {}}
      />,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("highlights active item", () => {
    render(
      <NavProjects
        items={items}
        isActive={(href) => href === "/"}
        onNavigate={() => {}}
      />,
    );
    const buttons = document.querySelectorAll(
      "[data-slot='sidebar-menu-button']",
    );
    expect(buttons[0]).toHaveAttribute("data-active", "true");
    expect(buttons[1]).toHaveAttribute("data-active", "false");
  });

  it("calls onNavigate when item is clicked", () => {
    const onNavigate = vi.fn();
    render(
      <NavProjects
        items={items}
        isActive={() => false}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByText("Home"));
    expect(onNavigate).toHaveBeenCalledWith("/");
  });

  it("returns null when items are empty", () => {
    const { container } = render(
      <NavProjects items={[]} isActive={() => false} onNavigate={() => {}} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
