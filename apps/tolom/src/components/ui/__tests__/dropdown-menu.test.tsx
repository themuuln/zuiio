import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

describe("DropdownMenu", () => {
  function TestDropdownMenu({ open = false }: { open?: boolean }) {
    const [isOpen, setIsOpen] = useState(open);
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  it("renders trigger", () => {
    render(<TestDropdownMenu />);
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='dropdown-menu-trigger']"),
    ).toBeInTheDocument();
  });

  it("does not show content by default", () => {
    render(<TestDropdownMenu />);
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
  });

  it("renders content when open", () => {
    render(<TestDropdownMenu open />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("renders menu label", () => {
    render(<TestDropdownMenu open />);
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("renders separator", () => {
    render(<TestDropdownMenu open />);
    const sep = document.querySelector("[data-slot='dropdown-menu-separator']");
    expect(sep).toBeInTheDocument();
  });

  it("renders destructive variant item", () => {
    render(<TestDropdownMenu open />);
    const items = document.querySelectorAll("[data-slot='dropdown-menu-item']");
    // The last item is Logout with destructive variant
    const lastItem = items[items.length - 1];
    expect(lastItem).toHaveTextContent("Logout");
  });

  it("renders menu group", () => {
    render(<TestDropdownMenu open />);
    expect(
      document.querySelector("[data-slot='dropdown-menu-group']"),
    ).toBeInTheDocument();
  });

  it("opens on trigger click", () => {
    function InteractiveMenu() {
      const [open, setOpen] = useState(false);
      return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger>
            <Button>Toggle Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Option A</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    render(<InteractiveMenu />);
    expect(screen.queryByText("Option A")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Toggle Menu"));
    expect(screen.getByText("Option A")).toBeInTheDocument();
  });
});

describe("DropdownMenuItem", () => {
  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <DropdownMenu open onOpenChange={() => {}}>
        <DropdownMenuTrigger>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick}>Click Me</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByText("Click Me"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders with inset prop", () => {
    render(
      <DropdownMenu open onOpenChange={() => {}}>
        <DropdownMenuTrigger>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Indented Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByText("Indented Item");
    expect(item).toBeInTheDocument();
  });
});

describe("DropdownMenuCheckboxItem", () => {
  it("renders checkbox item when open", () => {
    render(
      <DropdownMenu open onOpenChange={() => {}}>
        <DropdownMenuTrigger>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>
            Show Details
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Show Details")).toBeInTheDocument();
  });
});

describe("DropdownMenuRadioItem", () => {
  it("renders radio items", () => {
    render(
      <DropdownMenu open onOpenChange={() => {}}>
        <DropdownMenuTrigger>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="asc">
            <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc">
              Descending
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Ascending")).toBeInTheDocument();
    expect(screen.getByText("Descending")).toBeInTheDocument();
  });
});

describe("DropdownMenuShortcut", () => {
  it("renders shortcut", () => {
    render(
      <DropdownMenu open onOpenChange={() => {}}>
        <DropdownMenuTrigger>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Save
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("⌘S")).toBeInTheDocument();
  });
});

describe("DropdownMenuSub", () => {
  it("renders sub trigger", () => {
    render(
      <DropdownMenu open onOpenChange={() => {}}>
        <DropdownMenuTrigger>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("More Options")).toBeInTheDocument();
  });

  it("renders sub trigger with inset", () => {
    render(
      <DropdownMenu open onOpenChange={() => {}}>
        <DropdownMenuTrigger>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Nested</DropdownMenuSubTrigger>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });
});
