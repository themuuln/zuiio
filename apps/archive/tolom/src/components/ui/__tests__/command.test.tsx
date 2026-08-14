import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

function renderCommand(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Command", () => {
  it("renders with data-slot", () => {
    const { $ } = renderCommand(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Items">
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect($("[data-slot='command']")).toBeInTheDocument();
  });

  it("renders input with search icon", () => {
    const { $ } = renderCommand(
      <Command>
        <CommandInput placeholder="Search..." />
      </Command>,
    );
    expect($("[data-slot='command-input']")).toBeInTheDocument();
  });

  it("renders items", () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>Item 1</CommandItem>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(
      <Command>
        <CommandList>
          <CommandEmpty>No results found</CommandEmpty>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("renders group with heading", () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="Actions">
            <CommandItem>Action 1</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Action 1")).toBeInTheDocument();
  });

  it("renders separator", () => {
    const { $ } = renderCommand(
      <Command>
        <CommandList>
          <CommandItem>First</CommandItem>
          <CommandSeparator />
          <CommandItem>Second</CommandItem>
        </CommandList>
      </Command>,
    );
    expect($("[data-slot='command-separator']")).toBeInTheDocument();
  });

  it("renders shortcut", () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>
            Copy
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText("⌘C")).toBeInTheDocument();
    expect(screen.getByText("⌘C")).toHaveAttribute(
      "data-slot",
      "command-shortcut",
    );
  });

  it("applies custom className", () => {
    const { $ } = renderCommand(
      <Command className="custom-cmd">
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>,
    );
    expect($("[data-slot='command']")?.className).toContain("custom-cmd");
  });
});
