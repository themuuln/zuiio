import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

function renderMenubar(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Menubar", () => {
  it("renders with data-slot menubar", () => {
    const { $ } = renderMenubar(<Menubar />);
    expect($("[data-slot='menubar']")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderMenubar(<Menubar className="custom-menubar" />);
    expect($("[data-slot='menubar']")?.className).toContain("custom-menubar");
  });
});

describe("MenubarTrigger", () => {
  it("renders the trigger text inside a menu", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );
    expect(screen.getByText("Help")).toBeInTheDocument();
  });
});

describe("MenubarContent", () => {
  it("renders items inside open content", () => {
    render(
      <Menubar defaultOpen>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New Tab</MenubarItem>
            <MenubarItem>New Window</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    expect(screen.getByText("New Tab")).toBeInTheDocument();
    expect(screen.getByText("New Window")).toBeInTheDocument();
  });
});

describe("MenubarItem", () => {
  it("renders text inside an open menu", () => {
    render(
      <Menubar defaultOpen>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Save</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});

describe("MenubarLabel", () => {
  it("renders text inside a group within an open menu", () => {
    render(
      <Menubar defaultOpen>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Options</MenubarLabel>
              <MenubarItem>Setting</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    expect(screen.getByText("Options")).toBeInTheDocument();
    expect(screen.getByText("Setting")).toBeInTheDocument();
  });
});

describe("MenubarSeparator", () => {
  it("renders inside an open menu", () => {
    const { $ } = renderMenubar(
      <Menubar defaultOpen>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarSeparator />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    expect($("[data-slot='menubar-separator']")).toBeInTheDocument();
  });
});

describe("MenubarShortcut", () => {
  it("renders with data-slot menubar-shortcut", () => {
    const { $ } = renderMenubar(<MenubarShortcut>⌘S</MenubarShortcut>);
    expect($("[data-slot='menubar-shortcut']")).toBeInTheDocument();
  });

  it("renders shortcut text", () => {
    render(<MenubarShortcut>⌘P</MenubarShortcut>);
    expect(screen.getByText("⌘P")).toBeInTheDocument();
  });
});
