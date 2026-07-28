import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

function _renderPopover(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Popover", () => {
  function TestPopover({ open = false }: { open?: boolean }) {
    const [isOpen, setIsOpen] = useState(open);
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger>
          <Button>Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Popover Title</PopoverTitle>
            <PopoverDescription>
              This is a description for the popover.
            </PopoverDescription>
          </PopoverHeader>
          <p>Popover body content</p>
        </PopoverContent>
      </Popover>
    );
  }

  it("renders trigger", () => {
    render(<TestPopover />);
    expect(screen.getByText("Open Popover")).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='popover-trigger']"),
    ).toBeInTheDocument();
  });

  it("does not show content by default", () => {
    render(<TestPopover />);
    const content = document.querySelector("[data-slot='popover-content']");
    expect(content).not.toBeInTheDocument();
  });

  it("renders content when open", () => {
    render(<TestPopover open />);
    expect(screen.getByText("Popover Title")).toBeInTheDocument();
    expect(
      screen.getByText("This is a description for the popover."),
    ).toBeInTheDocument();
    expect(screen.getByText("Popover body content")).toBeInTheDocument();
  });

  it("renders header with title and description data-slots", () => {
    render(<TestPopover open />);
    expect(
      document.querySelector("[data-slot='popover-header']"),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='popover-title']"),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='popover-description']"),
    ).toBeInTheDocument();
  });

  it("renders with custom className on content", () => {
    render(
      <Popover open onOpenChange={() => {}}>
        <PopoverTrigger>
          <Button>Trigger</Button>
        </PopoverTrigger>
        <PopoverContent className="custom-popover">
          <p>Custom styled content</p>
        </PopoverContent>
      </Popover>,
    );
    const content = document.querySelector("[data-slot='popover-content']");
    expect(content?.className).toContain("custom-popover");
  });

  it("renders content with different align prop", () => {
    render(
      <Popover open onOpenChange={() => {}}>
        <PopoverTrigger>
          <Button>Trigger</Button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top">
          <p>Aligned content</p>
        </PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Aligned content")).toBeInTheDocument();
  });

  it("opens when trigger is clicked", () => {
    function InteractivePopover() {
      const [open, setOpen] = useState(false);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>
            <Button>Click Me</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p>Now visible</p>
          </PopoverContent>
        </Popover>
      );
    }
    render(<InteractivePopover />);
    expect(screen.queryByText("Now visible")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Click Me"));
    expect(screen.getByText("Now visible")).toBeInTheDocument();
  });
});
