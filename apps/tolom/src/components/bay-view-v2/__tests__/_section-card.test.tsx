import { fireEvent, screen } from "@testing-library/react";
import { Wrench } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { SectionCard } from "../_section-card";

describe("SectionCard", () => {
  const baseProps = {
    icon: Wrench,
    title: "Services",
    addLabel: "Add service",
    onToggleAdd: vi.fn(),
  };

  it("renders title, count badge and children", () => {
    render(
      <SectionCard {...baseProps} count={3}>
        <span>row</span>
      </SectionCard>,
    );
    expect(screen.getByText("Services")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("row")).toBeTruthy();
  });

  it("hides the count badge when count is zero", () => {
    render(
      <SectionCard {...baseProps} count={0}>
        <span>row</span>
      </SectionCard>,
    );
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.getByText("row")).toBeTruthy();
  });

  it("shows the empty state message instead of children when empty", () => {
    render(
      <SectionCard {...baseProps} isEmpty emptyMessage="Nothing here">
        <span>row</span>
      </SectionCard>,
    );
    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.queryByText("row")).toBeNull();
  });

  it("keeps children visible when adding even if empty", () => {
    render(
      <SectionCard {...baseProps} isEmpty isAdding>
        <span>row</span>
      </SectionCard>,
    );
    expect(screen.getByText("row")).toBeTruthy();
  });

  it("calls onToggleAdd when the add button is clicked", () => {
    const onToggleAdd = vi.fn();
    render(<SectionCard {...baseProps} onToggleAdd={onToggleAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /Add service/ }));
    expect(onToggleAdd).toHaveBeenCalledTimes(1);
  });
});
