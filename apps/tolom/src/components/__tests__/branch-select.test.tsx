import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BranchSelect } from "@/components/branch-select";

// Minimal select double mirroring the Base UI contract BranchSelect uses
// (value/onValueChange + trigger/value/content/item).
vi.mock("@/components/ui/select", () => {
  const React = require("react");
  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string | null;
    onValueChange?: (value: string | null) => void;
    children?: React.ReactNode;
  }) {
    return (
      <select
        data-testid="branch-select"
        value={value ?? undefined}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onValueChange?.(e.target.value)
        }
      >
        {children}
      </select>
    );
  }
  function SelectTrigger({
    children,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) {
    return <>{children}</>;
  }
  function SelectValue({ placeholder }: { placeholder?: string }) {
    return <span data-testid="select-value">{placeholder}</span>;
  }
  function SelectContent({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }
  function SelectItem({
    value,
    children,
  }: {
    value: string;
    children?: React.ReactNode;
  }) {
    return <option value={value}>{children}</option>;
  }
  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

const branches = [
  { id: "b-1", name: "Central" },
  { id: "b-2", name: "North" },
];

function renderSelect(onChange: (branchId: string) => void = vi.fn()) {
  render(
    <BranchSelect
      value=""
      onChange={onChange}
      branches={branches}
      placeholder="Select branch"
      allLabel="All branches"
    />,
  );
  return onChange;
}

describe("BranchSelect", () => {
  it("renders the placeholder", () => {
    renderSelect();
    expect(screen.getByTestId("select-value")).toHaveTextContent(
      "Select branch",
    );
  });

  it("lists all branches plus the all option", () => {
    renderSelect();
    const select = screen.getByTestId("branch-select") as HTMLSelectElement;
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(3);
    expect(select.textContent).toContain("All branches");
    expect(select.textContent).toContain("Central");
    expect(select.textContent).toContain("North");
  });

  it("calls onChange with the selected branch id", () => {
    const onChange = renderSelect();
    fireEvent.change(screen.getByTestId("branch-select"), {
      target: { value: "b-1" },
    });
    expect(onChange).toHaveBeenCalledWith("b-1");
  });

  it("calls onChange with 'all' when the all option is picked", () => {
    const onChange = renderSelect();
    fireEvent.change(screen.getByTestId("branch-select"), {
      target: { value: "all" },
    });
    expect(onChange).toHaveBeenCalledWith("all");
  });

  it("shows the current selection as the select value", () => {
    render(
      <BranchSelect
        value="b-2"
        onChange={vi.fn()}
        branches={branches}
        placeholder="Select branch"
        allLabel="All branches"
      />,
    );
    const select = screen.getByTestId("branch-select") as HTMLSelectElement;
    expect(select.value).toBe("b-2");
  });

  it("renders and triggers the add-branch action", () => {
    const onAddBranch = vi.fn();
    render(
      <BranchSelect
        value=""
        onChange={vi.fn()}
        branches={branches}
        placeholder="Select branch"
        allLabel="All branches"
        onAddBranch={onAddBranch}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "+ Add Branch" }));
    expect(onAddBranch).toHaveBeenCalledTimes(1);
  });
});
