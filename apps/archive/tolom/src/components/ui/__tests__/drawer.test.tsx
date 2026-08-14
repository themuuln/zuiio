import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

function renderDrawer(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

function TestDrawer({ open = true }: { open?: boolean }) {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger render={<Button />}>Open</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Title</DrawerTitle>
          <DrawerDescription>Description</DrawerDescription>
        </DrawerHeader>
        <div>Content body</div>
        <DrawerFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close drawer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

describe("Drawer", () => {
  it("renders trigger button", () => {
    render(<TestDrawer open={false} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders content when open", () => {
    render(<TestDrawer open={true} />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Content body")).toBeInTheDocument();
  });

  it("renders header with data-slot", () => {
    const { $ } = renderDrawer(<TestDrawer open={true} />);
    expect($("[data-slot='drawer-header']")).toBeInTheDocument();
  });

  it("renders footer with data-slot", () => {
    const { $ } = renderDrawer(<TestDrawer open={true} />);
    expect($("[data-slot='drawer-footer']")).toBeInTheDocument();
  });

  it("renders title and description", () => {
    const { $ } = renderDrawer(<TestDrawer open={true} />);
    expect($("[data-slot='drawer-title']")).toBeInTheDocument();
    expect($("[data-slot='drawer-description']")).toBeInTheDocument();
  });

  it("renders backdrop when open", () => {
    const { $ } = renderDrawer(<TestDrawer open={true} />);
    expect($("[data-slot='drawer-backdrop']")).toBeInTheDocument();
  });
});
