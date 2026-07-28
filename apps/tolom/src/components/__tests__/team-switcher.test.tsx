import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeamSwitcher } from "@/components/team-switcher";

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

let mockSelectedBranchId = "all";
let mockBranches: { id: string; name: string }[] = [];
let mockHasPermission = true;
let mockIsMechanic = false;
let mockOrgName = "Test Org";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "dashboard.allBranches": "All Branches",
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => mockSelectedBranchId,
  useSetSelectedBranchId: () => vi.fn(),
}));

vi.mock("@/lib/queries/use-branches", () => ({
  useBranches: () => ({ data: mockBranches, isLoading: false }),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1", orgName: mockOrgName } }),
}));

vi.mock("@/hooks/use-current-user-role", () => ({
  useCurrentUserRole: () => ({
    isMechanic: mockIsMechanic,
    hasPermission: () => mockHasPermission,
  }),
}));

vi.mock("@/components/branches/quick-create-branch-drawer", () => ({
  QuickCreateBranchDrawer: () => null,
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SidebarMenuButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useSidebar: () => ({ isMobile: false }),
}));

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
  }) => <div onClick={onClick}>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("lucide-react", () => ({
  Building2: () => null,
  Check: () => null,
  ChevronsUpDown: () => null,
  CirclePlus: () => null,
  Store: () => null,
}));

describe("TeamSwitcher", () => {
  beforeEach(() => {
    mockSelectedBranchId = "all";
    mockBranches = [];
    mockHasPermission = true;
    mockIsMechanic = false;
    mockOrgName = "Test Org";
  });

  it("renders org name", () => {
    render(<TeamSwitcher />);
    expect(screen.getByText("Test Org")).toBeInTheDocument();
  });

  it("renders 'All Branches' text", () => {
    render(<TeamSwitcher />);
    const matches = screen.getAllByText("All Branches");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders selected branch name", () => {
    mockSelectedBranchId = "branch-1";
    mockBranches = [{ id: "branch-1", name: "Main Branch" }];
    render(<TeamSwitcher />);
    const matches = screen.getAllByText("Main Branch");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
