import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { MechanicAssignDrawer } from "../_mechanic-assign-drawer";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

let pickerProps: {
  open: boolean;
  selectedIds: string[];
  leadId: string | null;
  onToggle: (id: string) => void;
  onSetLead: (id: string) => void;
} | null = null;

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: (props: {
    open: boolean;
    selectedIds: string[];
    leadId: string | null;
    mechanics: { id: string }[];
    onToggle: (id: string) => void;
    onSetLead: (id: string) => void;
  }) => {
    pickerProps = props;
    return props.open ? (
      <div data-testid="mechanic-picker">
        {props.mechanics.map((m) => (
          <button key={m.id} type="button" onClick={() => props.onToggle(m.id)}>
            toggle-{m.id}
          </button>
        ))}
        <button type="button" onClick={() => props.onSetLead("m-2")}>
          set-lead
        </button>
      </div>
    ) : null;
  },
}));

const mechanics = [
  { id: "m-1", full_name: "Бат", avatar_url: null },
  { id: "m-2", full_name: "Нара", avatar_url: null },
];

describe("MechanicAssignDrawer", () => {
  it("opens the picker with the assign title when no lead is set", () => {
    render(
      <MechanicAssignDrawer
        trigger={<span>trigger</span>}
        mechanics={mechanics}
        leadMechanicId={null}
        helpers={[]}
        onAssignLead={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "assignMechanic" }));
    expect(pickerProps?.open).toBe(true);
    expect(pickerProps?.selectedIds).toEqual([]);
  });

  it("assigns the first mechanic as lead", () => {
    const onAssignLead = vi.fn().mockResolvedValue(undefined);
    render(
      <MechanicAssignDrawer
        trigger={<span>trigger</span>}
        mechanics={mechanics}
        leadMechanicId={null}
        helpers={[]}
        onAssignLead={onAssignLead}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "assignMechanic" }));
    fireEvent.click(screen.getByRole("button", { name: "toggle-m-1" }));
    expect(onAssignLead).toHaveBeenCalledWith("m-1");
  });

  it("adds a helper when a lead is already assigned", () => {
    const onAssignHelper = vi.fn().mockResolvedValue(undefined);
    render(
      <MechanicAssignDrawer
        trigger={<span>trigger</span>}
        mechanics={mechanics}
        leadMechanicId="m-1"
        helpers={[]}
        onAssignHelper={onAssignHelper}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "changeMechanic" }));
    fireEvent.click(screen.getByRole("button", { name: "toggle-m-2" }));
    expect(onAssignHelper).toHaveBeenCalledWith("m-2");
  });

  it("unassigns the lead mechanic", () => {
    const onUnassign = vi.fn().mockResolvedValue(undefined);
    render(
      <MechanicAssignDrawer
        trigger={<span>trigger</span>}
        mechanics={mechanics}
        leadMechanicId="m-1"
        helpers={[]}
        onUnassign={onUnassign}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "changeMechanic" }));
    fireEvent.click(screen.getByRole("button", { name: "toggle-m-1" }));
    expect(onUnassign).toHaveBeenCalledWith("m-1");
  });

  it("disables the trigger while pending", () => {
    render(
      <MechanicAssignDrawer
        trigger={<span>trigger</span>}
        mechanics={mechanics}
        leadMechanicId={null}
        helpers={[]}
        disabled
      />,
    );
    expect(
      (
        screen.getByRole("button", {
          name: "assignMechanic",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
