import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function renderDialog(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("Dialog", () => {
  function TestDialog({ open = true }: { open?: boolean }) {
    const [isOpen, setIsOpen] = useState(open);
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogHeader>
          <p>Dialog body content</p>
          <DialogFooter>
            <DialogClose>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  it("renders trigger button", () => {
    render(<TestDialog open={false} />);
    expect(screen.getByText("Open Dialog")).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='dialog-trigger']"),
    ).toBeInTheDocument();
  });

  it("renders content when open", () => {
    render(<TestDialog open />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Dialog body content")).toBeInTheDocument();
  });

  it("renders title and description with correct data-slots", () => {
    render(<TestDialog open />);
    expect(
      document.querySelector("[data-slot='dialog-title']"),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='dialog-description']"),
    ).toBeInTheDocument();
  });

  it("renders overlay", () => {
    renderDialog(<TestDialog open />);
    const overlay = document.querySelector("[data-slot='dialog-overlay']");
    expect(overlay).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<TestDialog open />);
    // Two elements contain "Close" text: the footer button and the X button sr-only span
    expect(screen.getAllByText("Close").length).toBeGreaterThanOrEqual(1);
    expect(
      document.querySelector("[data-slot='dialog-close']"),
    ).toBeInTheDocument();
  });

  it("renders header and footer", () => {
    render(<TestDialog open />);
    expect(
      document.querySelector("[data-slot='dialog-header']"),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-slot='dialog-footer']"),
    ).toBeInTheDocument();
  });

  it("renders content with showCloseButton=false", () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>No Close</DialogTitle>
          <p>Content without close X button</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("No Close")).toBeInTheDocument();
    expect(
      screen.getByText("Content without close X button"),
    ).toBeInTheDocument();
  });

  it("renders footer with showCloseButton=true", () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
          <DialogFooter showCloseButton>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders with custom className on content", () => {
    const { $ } = renderDialog(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent className="custom-dialog">
          <DialogTitle>Styled</DialogTitle>
          <p>Content</p>
        </DialogContent>
      </Dialog>,
    );
    const popup = $("[data-slot='dialog-content']");
    expect(popup?.className).toContain("custom-dialog");
  });

  it("does not show content when closed", () => {
    render(<TestDialog open={false} />);
    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
    expect(screen.queryByText("Dialog body content")).not.toBeInTheDocument();
  });
});
