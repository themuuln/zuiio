import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";

describe("VehicleMakeLogo", () => {
  it("renders an inline brand SVG for a known make", () => {
    const { container } = render(<VehicleMakeLogo make="Toyota" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.textContent).not.toContain("T");
  });

  it("normalizes case and whitespace when resolving the make", () => {
    const { container } = render(<VehicleMakeLogo make="  toyota  " />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an SVG fallback for Lexus, Genesis and Land Rover", () => {
    for (const make of ["Lexus", "Genesis", "Land Rover"]) {
      const { container } = render(<VehicleMakeLogo make={make} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("renders the first letter for unknown makes", () => {
    const { container } = render(<VehicleMakeLogo make="Dacia" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.textContent).toContain("D");
  });

  it("renders a letter fallback for null and undefined makes", () => {
    const { container: c1 } = render(<VehicleMakeLogo make={null} />);
    expect(c1.querySelector("svg")).toBeInTheDocument();
    const { container: c2 } = render(<VehicleMakeLogo make={undefined} />);
    expect(c2.querySelector("svg")).toBeInTheDocument();
  });

  it("applies a size to the logo svg when provided", () => {
    const { container } = render(<VehicleMakeLogo make="Honda" size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("forwards the className to the logo", () => {
    const { container } = render(
      <VehicleMakeLogo make="BMW" className="custom-class" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("custom-class");
  });
});
