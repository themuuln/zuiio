import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

function renderNM(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("NavigationMenu", () => {
  it("renders NavigationMenu root with data-slot", () => {
    const { $ } = renderNM(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect($("[data-slot='navigation-menu']")).toBeInTheDocument();
  });

  it("renders list with data-slot", () => {
    const { $ } = renderNM(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect($("[data-slot='navigation-menu-list']")).toBeInTheDocument();
  });

  it("renders trigger with data-slot", () => {
    const { $ } = renderNM(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Services</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect($("[data-slot='navigation-menu-trigger']")).toBeInTheDocument();
  });

  it("renders trigger children text", () => {
    renderNM(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Services</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByText("Services")).toBeInTheDocument();
  });

  it("renders multiple items", () => {
    renderNM(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Services</NavigationMenuTrigger>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Inventory</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
  });
});
