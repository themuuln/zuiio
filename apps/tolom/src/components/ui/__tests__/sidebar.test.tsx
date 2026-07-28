// Mock next-intl's useTranslations for the Sidebar component
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => {
      const labels: Record<string, string> = {
        sidebarTitle: "Sidebar",
        sidebarDescription: "Sidebar navigation",
      };
      return labels[key] ?? key;
    },
  };
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

function _renderSidebar(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("SidebarProvider", () => {
  it("renders children", () => {
    render(
      <SidebarProvider>
        <div data-testid="child">Content</div>
      </SidebarProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders with Sidebar and SidebarContent", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div>Header</div>
          </SidebarHeader>
          <SidebarContent>
            <p>Navigation</p>
          </SidebarContent>
          <SidebarFooter>
            <div>Footer</div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <p>Main Content</p>
        </SidebarInset>
      </SidebarProvider>,
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();
  });

  it("renders sidebar with menu items", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>General</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Dashboard</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Settings</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders sidebar with isActive menu button", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>Active Item</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );
    expect(screen.getByText("Active Item")).toBeInTheDocument();
  });

  it("renders sidebar trigger button", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarTrigger />
        </Sidebar>
      </SidebarProvider>,
    );
    const trigger = document.querySelector("[data-slot='sidebar-trigger']");
    expect(trigger).toBeInTheDocument();
  });

  it("renders sidebar rail", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>,
    );
    const rail = document.querySelector("[data-slot='sidebar-rail']");
    expect(rail).toBeInTheDocument();
  });

  it("renders sidebar separator", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarSeparator />
        </Sidebar>
      </SidebarProvider>,
    );
    const sep = document.querySelector("[data-slot='sidebar-separator']");
    expect(sep).toBeInTheDocument();
  });

  it("renders with right side", () => {
    render(
      <SidebarProvider>
        <Sidebar side="right">
          <SidebarContent>
            <p>Right sidebar</p>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );
    expect(screen.getByText("Right sidebar")).toBeInTheDocument();
  });

  it("renders MenuSkeleton", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );
    const skeletons = document.querySelectorAll(
      "[data-slot='sidebar-menu-skeleton']",
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("useSidebar", () => {
  it("provides sidebar state", () => {
    function TestConsumer() {
      const sidebar = useSidebar();
      return (
        <div>
          <span data-testid="open-state">
            {sidebar.open ? "open" : "closed"}
          </span>
        </div>
      );
    }
    render(
      <SidebarProvider defaultOpen>
        <Sidebar>
          <TestConsumer />
        </Sidebar>
      </SidebarProvider>,
    );
    expect(screen.getByTestId("open-state")).toHaveTextContent("open");
  });

  it("provides openMobile state", () => {
    function TestConsumer() {
      const sidebar = useSidebar();
      return (
        <div>
          <span data-testid="mobile-state">
            {sidebar.openMobile ? "mobile-open" : "mobile-closed"}
          </span>
        </div>
      );
    }
    render(
      <SidebarProvider>
        <Sidebar>
          <TestConsumer />
        </Sidebar>
      </SidebarProvider>,
    );
    expect(screen.getByTestId("mobile-state")).toHaveTextContent(
      "mobile-closed",
    );
  });
});

describe("SidebarMenuButton", () => {
  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onClick}>Clickable</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>,
    );
    fireEvent.click(screen.getByText("Clickable"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
