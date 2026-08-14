import { act, fireEvent, screen } from "@testing-library/react";
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
  onOpenChange: (open: boolean) => void;
} | null = null;

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: (props: {
    open: boolean;
    selectedIds: string[];
    leadId: string | null;
    mechanics: { id: string }[];
    onToggle: (id: string) => void;
    onSetLead: (id: string) => void;
    onOpenChange: (open: boolean) => void;
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
        <button type="button" onClick={() => props.onOpenChange(false)}>
          close-picker
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

  it("assigns the first mechanic as lead (after the debounced flush)", async () => {
    vi.useFakeTimers();
    try {
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
      // The picker flips instantly; the server sync is debounced.
      expect(pickerProps?.selectedIds).toEqual(["m-1"]);
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      expect(onAssignLead).toHaveBeenCalledWith("m-1");
    } finally {
      vi.useRealTimers();
    }
  });

  it("adds a helper when a lead is already assigned", async () => {
    vi.useFakeTimers();
    try {
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
      expect(pickerProps?.selectedIds).toEqual(["m-1", "m-2"]);
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      expect(onAssignHelper).toHaveBeenCalledWith("m-2");
    } finally {
      vi.useRealTimers();
    }
  });

  it("flushes the net diff for rapid set/remove toggles of the same mechanic", async () => {
    vi.useFakeTimers();
    try {
      const onAssignLead = vi.fn().mockResolvedValue(undefined);
      const onAssignHelper = vi.fn().mockResolvedValue(undefined);
      const onUnassign = vi.fn().mockResolvedValue(undefined);
      render(
        <MechanicAssignDrawer
          trigger={<span>trigger</span>}
          mechanics={mechanics}
          leadMechanicId={null}
          helpers={[]}
          onAssignLead={onAssignLead}
          onAssignHelper={onAssignHelper}
          onUnassign={onUnassign}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "assignMechanic" }));
      fireEvent.click(screen.getByRole("button", { name: "toggle-m-1" }));
      fireEvent.click(screen.getByRole("button", { name: "toggle-m-1" }));
      fireEvent.click(screen.getByRole("button", { name: "toggle-m-1" }));
      // Every click flips instantly — none are dropped while "in flight".
      expect(pickerProps?.selectedIds).toEqual(["m-1"]);
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      // Net diff after the burst: m-1 assigned as lead, no helper mutations.
      expect(onAssignLead).toHaveBeenCalledWith("m-1");
      expect(onAssignHelper).not.toHaveBeenCalled();
      expect(onUnassign).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("collapses an on/off burst of the same mechanic into zero mutations", async () => {
    vi.useFakeTimers();
    try {
      const onAssignLead = vi.fn().mockResolvedValue(undefined);
      const onAssignHelper = vi.fn().mockResolvedValue(undefined);
      const onUnassign = vi.fn().mockResolvedValue(undefined);
      render(
        <MechanicAssignDrawer
          trigger={<span>trigger</span>}
          mechanics={mechanics}
          leadMechanicId={null}
          helpers={[]}
          onAssignLead={onAssignLead}
          onAssignHelper={onAssignHelper}
          onUnassign={onUnassign}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "assignMechanic" }));
      fireEvent.click(screen.getByRole("button", { name: "toggle-m-1" }));
      fireEvent.click(screen.getByRole("button", { name: "toggle-m-1" }));
      // Net zero — the picker returns to the initial state instantly.
      expect(pickerProps?.selectedIds).toEqual([]);
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      expect(onAssignLead).not.toHaveBeenCalled();
      expect(onAssignHelper).not.toHaveBeenCalled();
      expect(onUnassign).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("persists pending changes when the sheet closes before the debounce fires", async () => {
    vi.useFakeTimers();
    try {
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
      expect(pickerProps?.selectedIds).toEqual(["m-1"]);
      // Close immediately — the pending toggle flushes on close.
      fireEvent.click(screen.getByRole("button", { name: "close-picker" }));
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      expect(onAssignLead).toHaveBeenCalledWith("m-1");
    } finally {
      vi.useRealTimers();
    }
  });

  it("unassigns the lead mechanic", async () => {
    vi.useFakeTimers();
    try {
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
      expect(pickerProps?.selectedIds).toEqual([]);
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      expect(onUnassign).toHaveBeenCalledWith("m-1");
    } finally {
      vi.useRealTimers();
    }
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
