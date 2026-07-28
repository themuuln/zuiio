import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function renderToggleGroup(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("ToggleGroup", () => {
  it("renders with data-slot toggle-group", () => {
    const { $ } = renderToggleGroup(
      <ToggleGroup>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    const group = $("[data-slot='toggle-group']");
    expect(group).toBeInTheDocument();
  });

  it("renders all items", () => {
    renderToggleGroup(
      <ToggleGroup>
        <ToggleGroupItem value="a">Option A</ToggleGroupItem>
        <ToggleGroupItem value="b">Option B</ToggleGroupItem>
        <ToggleGroupItem value="c">Option C</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });

  it("renders items with data-slot toggle-group-item", () => {
    const { $$ } = renderToggleGroup(
      <ToggleGroup>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    const items = $$("[data-slot='toggle-group-item']");
    expect(items).toHaveLength(2);
  });

  it("accepts custom className", () => {
    const { $ } = renderToggleGroup(
      <ToggleGroup className="custom-group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    const group = $("[data-slot='toggle-group']");
    expect(group?.className).toContain("custom-group");
  });

  it("renders with vertical orientation", () => {
    const { $ } = renderToggleGroup(
      <ToggleGroup orientation="vertical">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    const group = $("[data-slot='toggle-group']");
    expect(group).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders with custom spacing", () => {
    const { $ } = renderToggleGroup(
      <ToggleGroup spacing={4}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    const group = $("[data-slot='toggle-group']");
    expect(group).toHaveAttribute("data-spacing", "4");
  });

  it("renders item with custom className", () => {
    const { $ } = renderToggleGroup(
      <ToggleGroup>
        <ToggleGroupItem value="a" className="custom-item">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    const item = $("[data-slot='toggle-group-item']");
    expect(item?.className).toContain("custom-item");
  });
});
