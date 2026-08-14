import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModeTabs } from "@/components/vehicles/form-sections/_mode-tabs";

const t = (key: string, params?: { fallback?: string }) =>
  params?.fallback ?? key;

describe("ModeTabs", () => {
  it("renders both mode triggers", () => {
    render(<ModeTabs currentMode="quick" onModeChange={vi.fn()} t={t} />);
    expect(
      screen.getByRole("tab", { name: "Quick Vehicle" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Full Details" }),
    ).toBeInTheDocument();
  });

  it("marks the current mode as the active tab", () => {
    const { rerender } = render(
      <ModeTabs currentMode="quick" onModeChange={vi.fn()} t={t} />,
    );
    const quickTab = screen.getByRole("tab", { name: "Quick Vehicle" });
    expect(quickTab.hasAttribute("data-active")).toBe(true);

    rerender(<ModeTabs currentMode="full" onModeChange={vi.fn()} t={t} />);
    const fullTab = screen.getByRole("tab", { name: "Full Details" });
    expect(fullTab.hasAttribute("data-active")).toBe(true);
  });

  it("calls onModeChange with full when switching modes", () => {
    const onModeChange = vi.fn();
    render(<ModeTabs currentMode="quick" onModeChange={onModeChange} t={t} />);
    fireEvent.click(screen.getByRole("tab", { name: "Full Details" }));
    expect(onModeChange).toHaveBeenCalledWith("full");
  });

  it("calls onModeChange with quick when switching back", () => {
    const onModeChange = vi.fn();
    render(<ModeTabs currentMode="full" onModeChange={onModeChange} t={t} />);
    fireEvent.click(screen.getByRole("tab", { name: "Quick Vehicle" }));
    expect(onModeChange).toHaveBeenCalledWith("quick");
  });
});
