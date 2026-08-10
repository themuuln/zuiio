import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MechanicSelect } from "@/components/mechanic-select";

// Minimal combobox double that mirrors the contract MechanicSelect relies on
// (items / value / onValueChange / render-prop list) without portal machinery.
vi.mock("@/components/ui/combobox", () => {
  const comboboxItems: Array<{
    id: string;
    full_name?: string | null;
    fullName?: string | null;
    email?: string;
    current_jobs?: number;
  }> = [];
  let onValueChange: ((mechanic: unknown) => void) | null = null;

  function Combobox({
    items,
    onValueChange: onChange,
    children,
  }: {
    items: unknown[];
    onValueChange: (mechanic: unknown) => void;
    children?: React.ReactNode;
  }) {
    comboboxItems.length = 0;
    comboboxItems.push(...(items as typeof comboboxItems));
    onValueChange = onChange;
    return <div data-testid="combobox">{children}</div>;
  }

  function ComboboxInput({
    placeholder,
    disabled,
  }: {
    placeholder?: string;
    disabled?: boolean;
  }) {
    return <input placeholder={placeholder} disabled={disabled} />;
  }

  function ComboboxContent({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }

  function ComboboxList({
    children,
  }: {
    children: (mechanic: (typeof comboboxItems)[number]) => React.ReactNode;
  }) {
    return <div>{comboboxItems.map((item) => children(item))}</div>;
  }

  function ComboboxItem({
    value,
    children,
  }: {
    value: unknown;
    children?: React.ReactNode;
  }) {
    return (
      <button type="button" onClick={() => onValueChange?.(value)}>
        {children}
      </button>
    );
  }

  function ComboboxEmpty({ children }: { children?: React.ReactNode }) {
    return <div>{children}</div>;
  }

  return {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty,
  };
});

const mechanics = [
  { id: "m-1", full_name: "Бат", current_jobs: 2 },
  { id: "m-2", full_name: "Нара", current_jobs: 0 },
];

describe("MechanicSelect", () => {
  it("renders the placeholder when no mechanic is selected", () => {
    render(
      <MechanicSelect value="" onChange={vi.fn()} mechanics={mechanics} />,
    );
    expect(screen.getByPlaceholderText("Unassigned")).toBeInTheDocument();
  });

  it("calls onChange with the mechanic id when one is picked", () => {
    const onChange = vi.fn();
    render(
      <MechanicSelect value="" onChange={onChange} mechanics={mechanics} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Бат/ }));
    expect(onChange).toHaveBeenCalledWith("m-1");
  });

  it("renders a custom placeholder", () => {
    render(
      <MechanicSelect
        value=""
        onChange={vi.fn()}
        mechanics={mechanics}
        placeholder="Pick a mechanic"
      />,
    );
    expect(screen.getByPlaceholderText("Pick a mechanic")).toBeInTheDocument();
  });

  it("shows the active job count in labels when showJobCount is set", () => {
    render(
      <MechanicSelect
        value=""
        onChange={vi.fn()}
        mechanics={mechanics}
        showJobCount
      />,
    );
    expect(screen.getByText("Бат (2 jobs)")).toBeInTheDocument();
    expect(screen.getByText("Нара")).toBeInTheDocument();
  });

  it("passes disabled state to the input", () => {
    render(
      <MechanicSelect
        value="m-1"
        onChange={vi.fn()}
        mechanics={mechanics}
        disabled
      />,
    );
    expect(screen.getByPlaceholderText("Unassigned")).toBeDisabled();
  });

  it("renders the empty message when there are no mechanics", () => {
    render(<MechanicSelect value="" onChange={vi.fn()} mechanics={[]} />);
    expect(screen.getByText("No mechanics found")).toBeInTheDocument();
  });
});
