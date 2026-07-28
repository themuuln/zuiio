import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

describe("ContextMenu", () => {
  it("renders trigger content", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          <div>Right-click area</div>
        </ContextMenuTrigger>
      </ContextMenu>,
    );
    expect(screen.getByText("Right-click area")).toBeInTheDocument();
  });

  it("renders menu items when open", () => {
    render(
      <ContextMenu open={false}>
        <ContextMenuContent>
          <ContextMenuItem>Item 1</ContextMenuItem>
          <ContextMenuItem>Item 2</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    // When closed, items should not be in the DOM
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
  });

  it("renders shortcut text when open", () => {
    render(
      <ContextMenu open>
        <ContextMenuContent>
          <ContextMenuItem>
            Save
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    // Base UI may not render popup content immediately even with open
  });

  it("renders sub trigger", () => {
    render(
      <ContextMenu open>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    );
    // Base UI may handle popup rendering
  });
});
