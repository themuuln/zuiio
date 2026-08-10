import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorSelect } from "@/components/vehicles/color-select";

// Minimal select double: mirrors the Base UI contract used by ColorSelect
// (value/onValueChange + trigger/value/content/item) without portal machinery.
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
        data-testid="select"
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
    SelectGroup: ({ children }: { children?: React.ReactNode }) => (
      <>{children}</>
    ),
    SelectLabel: () => null,
    SelectSeparator: () => null,
  };
});

describe("ColorSelect", () => {
  it("renders the placeholder when no color is selected", () => {
    render(<ColorSelect value="" onChange={vi.fn()} />);
    expect(screen.getByTestId("select-value")).toHaveTextContent(
      "Select color",
    );
  });

  it("renders a custom placeholder", () => {
    render(
      <ColorSelect value="" onChange={vi.fn()} placeholder="Pick a color" />,
    );
    expect(screen.getByTestId("select-value")).toHaveTextContent(
      "Pick a color",
    );
  });

  it("renders a color swatch with the known color hex", () => {
    const { container } = render(
      <ColorSelect value="Red" onChange={vi.fn()} />,
    );
    const swatch = container.querySelector('span[aria-hidden="true"]');
    expect(swatch).toBeInTheDocument();
    expect(swatch).toHaveStyle({ backgroundColor: "#c62828" });
  });

  it("renders no swatch for an unknown color value", () => {
    const { container } = render(
      <ColorSelect value="Rainbow" onChange={vi.fn()} />,
    );
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it("shows the selected value in the select", () => {
    render(<ColorSelect value="Blue" onChange={vi.fn()} />);
    const select = screen.getByTestId("select") as HTMLSelectElement;
    expect(select.value).toBe("Blue");
  });

  it("calls onChange with the picked color label", () => {
    const onChange = vi.fn();
    render(<ColorSelect value="" onChange={onChange} />);
    fireEvent.change(screen.getByTestId("select"), {
      target: { value: "Silver" },
    });
    expect(onChange).toHaveBeenCalledWith("Silver");
  });

  it("lists all common car colors as options", () => {
    render(<ColorSelect value="" onChange={vi.fn()} />);
    const select = screen.getByTestId("select");
    const options = select.querySelectorAll("option");
    expect(options.length).toBe(15);
    expect(select.textContent).toContain("White");
    expect(select.textContent).toContain("Black");
    expect(select.textContent).toContain("Gold");
    expect(select.textContent).toContain("Teal");
  });
});
