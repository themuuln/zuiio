import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PickerDrawer } from "@/components/ui/picker-drawer";

describe("PickerDrawer", () => {
  it("renders the title and children when open", () => {
    render(
      <PickerDrawer
        open
        onOpenChange={vi.fn()}
        title="Add Service"
        description="Pick a service from the catalog"
      >
        <div>picker content</div>
      </PickerDrawer>,
    );
    expect(screen.getByText("Add Service")).toBeInTheDocument();
    expect(
      screen.getByText("Pick a service from the catalog"),
    ).toBeInTheDocument();
    expect(screen.getByText("picker content")).toBeInTheDocument();
  });

  it("renders no content when closed", () => {
    render(
      <PickerDrawer open={false} onOpenChange={vi.fn()} title="Add Service">
        <div>picker content</div>
      </PickerDrawer>,
    );
    expect(screen.queryByText("Add Service")).not.toBeInTheDocument();
    expect(screen.queryByText("picker content")).not.toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    render(
      <PickerDrawer open onOpenChange={vi.fn()} title="Add Service">
        <div>content</div>
      </PickerDrawer>,
    );
    expect(screen.getByText("Add Service")).toBeInTheDocument();
  });

  it("applies the default 2xl width class", () => {
    render(
      <PickerDrawer open onOpenChange={vi.fn()} title="Add Service">
        <div>content</div>
      </PickerDrawer>,
    );
    const drawer = document.querySelector("[data-slot='detail-drawer']");
    expect(drawer?.className).toContain("sm:max-w-[42rem]");
  });

  it("applies the requested width class", () => {
    render(
      <PickerDrawer open onOpenChange={vi.fn()} title="Add Service" size="3xl">
        <div>content</div>
      </PickerDrawer>,
    );
    const drawer = document.querySelector("[data-slot='detail-drawer']");
    expect(drawer?.className).toContain("sm:max-w-[48rem]");
  });
});
