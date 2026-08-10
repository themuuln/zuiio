import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MongolianLicensePlate,
  TextPlate,
} from "@/components/vehicles/license-plate";

describe("TextPlate", () => {
  it("renders nothing for null/undefined/empty plate", () => {
    const { container } = render(<TextPlate plate={null} />);
    expect(container.firstChild).toBeNull();
    const { container: container2 } = render(<TextPlate plate={undefined} />);
    expect(container2.firstChild).toBeNull();
    const { container: container3 } = render(<TextPlate plate="" />);
    expect(container3.firstChild).toBeNull();
  });

  it("formats a Mongolian plate as 4 digits + space + 3 letters", () => {
    render(<TextPlate plate="4444УНА" />);
    expect(screen.getByText("4444 УНА")).toBeInTheDocument();
  });

  it("transliterates Latin plate input to Cyrillic before formatting", () => {
    render(<TextPlate plate="4444UNA" />);
    expect(screen.getByText("4444 УНА")).toBeInTheDocument();
  });

  it("normalizes separators in the input plate", () => {
    render(<TextPlate plate="4444-УНА" />);
    expect(screen.getByText("4444 УНА")).toBeInTheDocument();
  });
});

describe("MongolianLicensePlate", () => {
  it("renders nothing for null/undefined plate", () => {
    const { container } = render(<MongolianLicensePlate plate={null} />);
    expect(container.firstChild).toBeNull();
    const { container: container2 } = render(
      <MongolianLicensePlate plate={undefined} />,
    );
    expect(container2.firstChild).toBeNull();
  });

  it("renders the Soyombo symbol for Mongolian plates", () => {
    const { container } = render(<MongolianLicensePlate plate="4444УНА" />);
    const title = container.querySelector("svg title");
    expect(title?.textContent).toBe("Soyombo Symbol");
  });

  it("splits a Mongolian plate into digits and letters", () => {
    const { container } = render(<MongolianLicensePlate plate="4444УНА" />);
    expect(screen.getByText("4444")).toBeInTheDocument();
    expect(container.textContent).toContain("УНА");
  });

  it("transliterates Latin letters for Mongolian plates", () => {
    const { container } = render(<MongolianLicensePlate plate="4444UNA" />);
    expect(screen.getByText("4444")).toBeInTheDocument();
    expect(container.textContent).toContain("УНА");
  });

  it("falls back to digits+letters split for non-Mongolian formats", () => {
    render(<MongolianLicensePlate plate="12A34" />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("А34")).toBeInTheDocument();
  });

  it("renders the full plate as digits when it starts with no digits", () => {
    render(<MongolianLicensePlate plate="ABC123" />);
    expect(screen.getByText("АБЦ123")).toBeInTheDocument();
  });
});
