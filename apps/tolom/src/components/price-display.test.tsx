import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PriceDisplay } from "./price-display";

describe("PriceDisplay", () => {
  it("renders the amount formatted as MNT", () => {
    render(<PriceDisplay amount={15000} />);
    expect(screen.getByText("₮ 15,000")).toBeDefined();
  });

  it("renders zero amount", () => {
    render(<PriceDisplay amount={0} />);
    expect(screen.getByText("₮ 0")).toBeDefined();
  });

  it("does not show last sold when lastSold is null", () => {
    render(<PriceDisplay amount={15000} lastSold={null} />);
    expect(screen.getByText("₮ 15,000")).toBeDefined();
    expect(screen.queryByText(/Last:/)).toBeNull();
  });

  it("does not show last sold when lastSold equals amount", () => {
    render(<PriceDisplay amount={15000} lastSold={15000} />);
    expect(screen.queryByText(/Last:/)).toBeNull();
  });

  it("shows last sold when it differs from amount (lower)", () => {
    render(<PriceDisplay amount={15000} lastSold={12000} />);
    expect(screen.getByText("₮ 15,000")).toBeDefined();
    expect(screen.getByText(/Last:.*₮ 12,000/)).toBeDefined();
  });

  it("shows last sold when it differs from amount (higher)", () => {
    render(<PriceDisplay amount={15000} lastSold={20000} />);
    expect(screen.getByText("₮ 15,000")).toBeDefined();
    expect(screen.getByText(/Last:.*₮ 20,000/)).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(
      <PriceDisplay amount={100} className="custom-class" />,
    );
    expect(
      container.firstElementChild?.classList.contains("custom-class"),
    ).toBe(true);
  });
});
