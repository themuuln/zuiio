import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterChips } from "@/components/filter-chips";

function renderFC(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("FilterChips", () => {
  const defaultItems = [
    { key: "all", label: "All", active: true, onClick: vi.fn() },
    {
      key: "active",
      label: "Active",
      active: false,
      onClick: vi.fn(),
    },
    {
      key: "completed",
      label: "Completed",
      active: false,
      onClick: vi.fn(),
    },
  ];

  it("renders all chip items", () => {
    render(<FilterChips items={defaultItems} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("applies default variant to active chip", () => {
    const { $$ } = renderFC(<FilterChips items={defaultItems} />);
    const chips = $$("[data-slot='filter-chip']");
    expect(chips[0]).toBeInTheDocument();
  });

  it("applies outline variant to inactive chips", () => {
    const { $$ } = renderFC(<FilterChips items={defaultItems} />);
    const chips = $$("[data-slot='filter-chip']");
    expect(chips[1]).toBeInTheDocument();
  });

  it("calls onClick when a chip is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <FilterChips
        items={[{ key: "all", label: "All", active: true, onClick }]}
      />,
    );
    await user.click(screen.getByText("All"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders color dot when colorDot is provided", () => {
    const { $ } = renderFC(
      <FilterChips
        items={[
          {
            key: "red",
            label: "Red",
            active: true,
            onClick: vi.fn(),
            colorDot: "bg-red-500",
          },
        ]}
      />,
    );
    const chip = $("[data-slot='filter-chip']");
    const dot = chip?.querySelector("span.rounded-full");
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain("bg-red-500");
  });

  it("renders count badge when count is provided", () => {
    render(
      <FilterChips
        items={[
          {
            key: "all",
            label: "All",
            active: true,
            onClick: vi.fn(),
            count: 42,
          },
        ]}
      />,
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("does not render count badge when count is undefined", () => {
    render(<FilterChips items={defaultItems} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { $ } = renderFC(
      <FilterChips items={defaultItems} className="custom-fc" />,
    );
    expect($(".custom-fc")).toBeInTheDocument();
  });
});
