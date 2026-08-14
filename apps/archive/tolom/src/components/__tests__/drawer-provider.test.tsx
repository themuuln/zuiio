import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DrawerProvider } from "@/components/drawer-provider";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

function renderWithDrawer() {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <DrawerProvider>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger render={<button type="button" />}>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Panel</DrawerTitle>
          </DrawerContent>
        </Drawer>
        <div>app content</div>
      </DrawerProvider>
    );
  }
  return render(<Harness />);
}

describe("DrawerProvider", () => {
  it("renders children inside the indent wrapper", () => {
    render(
      <DrawerProvider>
        <div>app content</div>
      </DrawerProvider>,
    );
    expect(screen.getByText("app content")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="drawer-indent"]')).toBeTruthy();
  });

  it("applies the indent scale effect when a drawer is open", () => {
    renderWithDrawer();
    const indent = document.querySelector(
      '[data-slot="drawer-indent"]',
    ) as HTMLElement;
    expect(indent.className).not.toContain("scale-[0.96]");

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(indent.className).toContain("scale-[0.96]");
  });
});
