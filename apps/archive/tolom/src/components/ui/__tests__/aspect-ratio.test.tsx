import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "@/components/ui/aspect-ratio";

function renderAspectRatio(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("AspectRatio", () => {
  it("renders with data-slot", () => {
    const { $ } = renderAspectRatio(<AspectRatio ratio={16 / 9} />);
    const el = $("[data-slot='aspect-ratio']");
    expect(el).toBeInTheDocument();
    expect(el?.tagName).toBe("DIV");
  });

  it("sets CSS custom property --ratio", () => {
    const { $ } = renderAspectRatio(<AspectRatio ratio={4 / 3} />);
    const el = $("[data-slot='aspect-ratio']") as HTMLElement;
    expect(el.style.getPropertyValue("--ratio")).toBe("1.3333333333333333");
  });

  it("accepts custom className", () => {
    const { $ } = renderAspectRatio(
      <AspectRatio ratio={1} className="custom-class" />,
    );
    expect($("[data-slot='aspect-ratio']")?.className).toContain(
      "custom-class",
    );
  });

  it("passes additional props", () => {
    const { $ } = renderAspectRatio(<AspectRatio ratio={2} data-testid="ar" />);
    expect($("[data-testid='ar']")).toBeInTheDocument();
  });

  it("renders children inside the container", () => {
    render(
      <AspectRatio ratio={1}>
        <div className="child-el">Child</div>
      </AspectRatio>,
    );
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("has relative positioning class", () => {
    const { $ } = renderAspectRatio(<AspectRatio ratio={1} />);
    expect($("[data-slot='aspect-ratio']")?.className).toContain("relative");
  });
});
