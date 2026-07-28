import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Slider } from "@/components/ui/slider";

function renderSlider(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  function $$(selector: string) {
    return result.baseElement.querySelectorAll(selector);
  }
  return { ...result, $, $$ };
}

describe("Slider", () => {
  it("renders with data-slot slider", () => {
    const { $ } = renderSlider(<Slider />);
    const slider = $("[data-slot='slider']");
    expect(slider).toBeInTheDocument();
  });

  it("renders track with data-slot slider-track", () => {
    const { $ } = renderSlider(<Slider />);
    const track = $("[data-slot='slider-track']");
    expect(track).toBeInTheDocument();
  });

  it("renders range indicator with data-slot slider-range", () => {
    const { $ } = renderSlider(<Slider />);
    const range = $("[data-slot='slider-range']");
    expect(range).toBeInTheDocument();
  });

  it("renders one thumb by default for single range", () => {
    const { $$ } = renderSlider(<Slider defaultValue={[30]} />);
    const thumbs = $$("[data-slot='slider-thumb']");
    expect(thumbs).toHaveLength(1);
  });

  it("renders two thumbs for range selection", () => {
    const { $$ } = renderSlider(<Slider defaultValue={[20, 80]} />);
    const thumbs = $$("[data-slot='slider-thumb']");
    expect(thumbs).toHaveLength(2);
  });

  it("renders with custom min and max", () => {
    const { $ } = renderSlider(<Slider min={0} max={200} />);
    const slider = $("[data-slot='slider']");
    expect(slider).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const { $ } = renderSlider(<Slider className="custom-slider" />);
    const slider = $("[data-slot='slider']");
    expect(slider?.className).toContain("custom-slider");
  });

  it("renders with disabled state", () => {
    const { $ } = renderSlider(<Slider disabled />);
    const slider = $("[data-slot='slider']");
    expect(slider).toBeInTheDocument();
  });
});
