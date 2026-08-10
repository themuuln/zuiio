import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ViewSelector } from "../_view-selector";

const t = (key: string) => key;

describe("ViewSelector", () => {
  it("renders all three view options", () => {
    render(<ViewSelector viewMode="grid" setViewMode={vi.fn()} t={t} />);
    expect(screen.getByRole("button", { name: "gridView" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "kanbanView" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "listView" })).toBeTruthy();
  });

  it("marks the active view with aria-pressed", () => {
    render(<ViewSelector viewMode="kanban" setViewMode={vi.fn()} t={t} />);
    expect(
      screen
        .getByRole("button", { name: "kanbanView" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "gridView" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("reports the selected mode on click", () => {
    const setViewMode = vi.fn();
    render(<ViewSelector viewMode="grid" setViewMode={setViewMode} t={t} />);
    fireEvent.click(screen.getByRole("button", { name: "listView" }));
    expect(setViewMode).toHaveBeenCalledWith("list");
  });
});
