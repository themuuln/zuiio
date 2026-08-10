import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayCardMechanicsRow } from "../_bay-card-mechanics-row";
import type { BayCardWorkOrder } from "../_bay-card-types";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

vi.mock("@/components/mechanic-avatar", () => ({
  MechanicAvatar: ({
    mechanic,
  }: {
    mechanic: { full_name: string | null };
  }) => <span data-testid="mechanic-avatar">{mechanic.full_name ?? "?"}</span>,
}));

vi.mock("@/components/mechanic-avatar-chip", () => ({
  MechanicAvatarChip: ({
    mechanic,
    onRemove,
  }: {
    mechanic: { id: string; full_name: string | null };
    onRemove?: () => void;
  }) => (
    <span data-testid="mechanic-chip">
      {mechanic.full_name ?? "?"}
      {onRemove && (
        <button
          type="button"
          aria-label={`remove-${mechanic.id}`}
          onClick={onRemove}
        >
          x
        </button>
      )}
    </span>
  ),
}));

let pickerProps: {
  open: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
} | null = null;

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: (props: {
    open: boolean;
    selectedIds: string[];
    mechanics: { id: string }[];
    onToggle: (id: string) => void;
  }) => {
    pickerProps = props;
    return props.open ? (
      <div data-testid="mechanic-picker">
        {props.mechanics.map((m) => (
          <button key={m.id} type="button" onClick={() => props.onToggle(m.id)}>
            toggle-{m.id}
          </button>
        ))}
      </div>
    ) : null;
  },
}));

function makeWorkOrder(
  overrides: Partial<BayCardWorkOrder> = {},
): BayCardWorkOrder {
  return {
    id: "wo-1",
    bay_number: 1,
    mechanic_id: "m-1",
    status: "In Progress",
    started_at: "2026-08-09T09:00:00Z",
    vehicle: null,
    mechanic: { id: "m-1", full_name: "Бат", avatar_url: null },
    helpers: [{ id: "h-1", full_name: "Цэцэг", avatar_url: null }],
    customer_name: null,
    ...overrides,
  };
}

describe("BayCardMechanicsRow", () => {
  it("renders the mechanic badge and helper chips", () => {
    render(<BayCardMechanicsRow workOrder={makeWorkOrder()} />);
    expect(screen.getByText("Бат")).toBeTruthy();
    expect(screen.getByText("Цэцэг")).toBeTruthy();
  });

  it("shows the unassigned label when there is no mechanic", () => {
    render(
      <BayCardMechanicsRow
        workOrder={makeWorkOrder({ mechanic: null, mechanic_id: null })}
      />,
    );
    expect(screen.getByText("Unassigned tech")).toBeTruthy();
  });

  it("removes a helper through the chip button", () => {
    const onRemoveHelper = vi.fn();
    render(
      <BayCardMechanicsRow
        workOrder={makeWorkOrder()}
        onRemoveHelper={onRemoveHelper}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "remove-h-1" }));
    expect(onRemoveHelper).toHaveBeenCalledWith("wo-1", "h-1");
  });

  it("opens the assign drawer and assigns the first mechanic as lead", () => {
    const onAssignMechanic = vi.fn().mockResolvedValue(undefined);
    render(
      <BayCardMechanicsRow
        workOrder={makeWorkOrder({
          mechanic: null,
          mechanic_id: null,
          helpers: [],
        })}
        mechanics={[{ id: "m-2", full_name: "Нара", avatar_url: null }]}
        onAssignMechanic={onAssignMechanic}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "assignMechanic" }));
    expect(pickerProps?.open).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "toggle-m-2" }));
    expect(onAssignMechanic).toHaveBeenCalledWith("wo-1", "m-2");
  });

  it("hides the assign drawer when no mechanics are available", () => {
    render(
      <BayCardMechanicsRow
        workOrder={makeWorkOrder({
          mechanic: null,
          mechanic_id: null,
          helpers: [],
        })}
        onAssignMechanic={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "assignMechanic" })).toBeNull();
  });

  it("renders the preview variant without helpers or assign button", () => {
    render(
      <BayCardMechanicsRow
        workOrder={makeWorkOrder()}
        variant="preview"
        mechanics={[{ id: "m-2", full_name: "Нара", avatar_url: null }]}
        onAssignMechanic={vi.fn()}
      />,
    );
    expect(screen.getByText("Бат")).toBeTruthy();
    expect(screen.queryByText("Цэцэг")).toBeNull();
    expect(screen.queryByRole("button", { name: "assignMechanic" })).toBeNull();
  });
});
