import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { BayNumberLabel } from "../_bay-number-label";

describe("BayNumberLabel", () => {
  it("zero-pads bay numbers to two digits", () => {
    render(<BayNumberLabel bayNumber={3} />);
    expect(screen.getByText("BAY 03")).toBeTruthy();
  });

  it("keeps two-digit bay numbers as-is", () => {
    render(<BayNumberLabel bayNumber={12} />);
    expect(screen.getByText("BAY 12")).toBeTruthy();
  });
});
