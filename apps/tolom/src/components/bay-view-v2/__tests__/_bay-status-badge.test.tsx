import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/test-utils";
import { BayStatusBadge } from "../_bay-status-badge";

describe("BayStatusBadge", () => {
  it("renders the provided label", () => {
    render(<BayStatusBadge status="In Progress" label="Шаардлагатай" />);
    expect(screen.getByText("Шаардлагатай")).toBeTruthy();
  });

  it("renders a pulse dot for In Progress", () => {
    const { container } = render(
      <BayStatusBadge status="In Progress" label="In Progress" />,
    );
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("does not render a pulse dot for other statuses", () => {
    const { container } = render(
      <BayStatusBadge status="Completed" label="Completed" />,
    );
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  it("applies the default muted class for unknown statuses", () => {
    const { container } = render(<BayStatusBadge status="Nope" label="Nope" />);
    expect(container.querySelector(".bg-muted")).toBeTruthy();
  });
});
