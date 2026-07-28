import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function TestAlertDialog({ open = true }: { open?: boolean }) {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger render={<Button />}>Open</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function renderAlertDialog(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("AlertDialog", () => {
  it("renders trigger button", () => {
    render(<TestAlertDialog open={false} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders content when open", () => {
    render(<TestAlertDialog open={true} />);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("renders title and description", () => {
    const { $ } = renderAlertDialog(<TestAlertDialog open={true} />);
    const title = $("[data-slot='alert-dialog-title']");
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("Are you sure?");
    expect(
      screen.getByText("This action cannot be undone."),
    ).toBeInTheDocument();
  });

  it("renders action and cancel buttons", () => {
    render(<TestAlertDialog open={true} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("renders overlay when open", () => {
    const { $ } = renderAlertDialog(<TestAlertDialog open={true} />);
    expect($("[data-slot='alert-dialog-overlay']")).toBeInTheDocument();
  });

  it("renders content with sm size", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent size="sm">
          <AlertDialogTitle>Small</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    const content = document.querySelector(
      "[data-slot='alert-dialog-content']",
    );
    expect(content).toHaveAttribute("data-size", "sm");
  });
});
