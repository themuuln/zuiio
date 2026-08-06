import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavUser } from "@/components/nav-user";

let mockProfile: { fullName: string; username: string; email: string } | null =
  {
    fullName: "Admin User",
    username: "admin",
    email: "admin@example.com",
  };
let mockIsMobile = false;

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      settings: "Settings",
      signOut: "Sign out",
      user: "User",
    };
    return map[key] ?? key;
  },
}));

// Mock lucide
vi.mock("lucide-react", () => ({
  LogOut: () => null,
  SettingsIcon: () => null,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock useProfile
vi.mock("@/lib/queries/use-profile", () => ({
  useProfile: () => ({ data: mockProfile, isLoading: false }),
}));

// Mock sidebar
vi.mock("@/components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SidebarMenuButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useSidebar: () => ({ isMobile: mockIsMobile }),
}));

// Mock dropdown-menu
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  getInitials: (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  },
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  formatCurrency: (v: number) => String(v),
  formatMNT: (v: number) => String(v),
  formatPlateNumber: (v: string) => v,
  stableStringify: (v: unknown) => JSON.stringify(v),
}));

describe("NavUser", () => {
  beforeEach(() => {
    mockProfile = {
      fullName: "Admin User",
      username: "admin",
      email: "admin@example.com",
    };
    mockIsMobile = false;
  });

  it("renders user display name", () => {
    render(<NavUser />);
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("renders user identifier", () => {
    render(<NavUser />);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("renders initials as fallback", () => {
    render(<NavUser />);
    expect(screen.getByText("AU")).toBeInTheDocument();
  });

  it("renders settings menu item", () => {
    render(<NavUser />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders sign out menu item", () => {
    render(<NavUser />);
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });
});
