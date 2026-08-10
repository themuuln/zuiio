import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BranchPills } from "../_branch-pills";

const t = (key: string) => key;

describe("BranchPills", () => {
  it("renders nothing when there is a single branch", () => {
    render(
      <BranchPills
        branches={[{ id: "b1", name: "Main" }]}
        selectedBranchId="b1"
        onBranchChange={vi.fn()}
        t={t}
      />,
    );
    // No branch buttons are rendered (the wrapper's theme script is the only
    // extra node in the container).
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders all branches plus the all-branches pill", () => {
    render(
      <BranchPills
        branches={[
          { id: "b1", name: "Main" },
          { id: "b2", name: "Second" },
        ]}
        selectedBranchId="all"
        onBranchChange={vi.fn()}
        t={t}
      />,
    );
    expect(screen.getByText("allBranches")).toBeTruthy();
    expect(screen.getByText("Main")).toBeTruthy();
    expect(screen.getByText("Second")).toBeTruthy();
  });

  it("calls onBranchChange when a branch pill is clicked", () => {
    const onBranchChange = vi.fn();
    render(
      <BranchPills
        branches={[
          { id: "b1", name: "Main" },
          { id: "b2", name: "Second" },
        ]}
        selectedBranchId="all"
        onBranchChange={onBranchChange}
        t={t}
      />,
    );
    fireEvent.click(screen.getByText("Second"));
    expect(onBranchChange).toHaveBeenCalledWith("b2");
  });

  it("calls onBranchChange with 'all' when the all pill is clicked", () => {
    const onBranchChange = vi.fn();
    render(
      <BranchPills
        branches={[
          { id: "b1", name: "Main" },
          { id: "b2", name: "Second" },
        ]}
        selectedBranchId="b1"
        onBranchChange={onBranchChange}
        t={t}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "allBranches" }));
    expect(onBranchChange).toHaveBeenCalledWith("all");
  });

  it("marks the selected branch with the active style", () => {
    const { container } = render(
      <BranchPills
        branches={[
          { id: "b1", name: "Main" },
          { id: "b2", name: "Second" },
        ]}
        selectedBranchId="b2"
        onBranchChange={vi.fn()}
        t={t}
      />,
    );
    const activeButtons = container.querySelectorAll("button.text-foreground");
    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0].textContent).toContain("Second");
  });
});
