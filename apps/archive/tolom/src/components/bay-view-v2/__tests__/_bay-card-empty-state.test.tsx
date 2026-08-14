import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayCardEmptyState } from "../_bay-card-empty-state";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

describe("BayCardEmptyState", () => {
  it("renders the bay number and add-vehicle hint", () => {
    render(<BayCardEmptyState bayNumber={4} />);
    expect(screen.getByText("BAY 04")).toBeTruthy();
    expect(screen.getByText("clickToAddVehicle")).toBeTruthy();
  });

  it("calls onAssignClick with the bay number", () => {
    const onAssignClick = vi.fn();
    render(<BayCardEmptyState bayNumber={2} onAssignClick={onAssignClick} />);
    screen.getByRole("button").click();
    expect(onAssignClick).toHaveBeenCalledWith(2);
  });

  it("is a button so the whole empty state is clickable", () => {
    render(<BayCardEmptyState bayNumber={1} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });
});
