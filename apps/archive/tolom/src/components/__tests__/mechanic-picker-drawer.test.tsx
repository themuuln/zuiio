import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MechanicPickerDrawer } from "@/components/mechanic-picker-drawer";
import type { MechanicPickerOption } from "@/lib/types/mechanic";

const comboboxState = vi.hoisted(() => ({
  props: null as null | Record<string, unknown>,
}));
vi.mock("@/components/mechanic-combobox", () => ({
  MechanicCombobox: (props: Record<string, unknown>) => {
    comboboxState.props = props;
    return <div data-testid="mock-combobox" />;
  },
}));

const mechanics: MechanicPickerOption[] = [
  { id: "m-1", full_name: "Бат" },
  { id: "m-2", full_name: "Нара" },
];

describe("MechanicPickerDrawer", () => {
  it("renders the title and forwards combobox props when open", () => {
    const onToggle = vi.fn();
    render(
      <MechanicPickerDrawer
        open
        onOpenChange={vi.fn()}
        title="Pick mechanic"
        mechanics={mechanics}
        onToggle={onToggle}
      />,
    );
    expect(screen.getByText("Pick mechanic")).toBeInTheDocument();
    expect(screen.getByTestId("mock-combobox")).toBeInTheDocument();
    expect(comboboxState.props?.mechanics).toBe(mechanics);
    expect(comboboxState.props?.onToggle).toBe(onToggle);
    expect(comboboxState.props?.className).toContain("flex-1");
  });

  it("renders nothing when closed", () => {
    render(
      <MechanicPickerDrawer
        open={false}
        onOpenChange={vi.fn()}
        mechanics={mechanics}
      />,
    );
    expect(screen.queryByText("Mechanics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-combobox")).not.toBeInTheDocument();
  });
});
