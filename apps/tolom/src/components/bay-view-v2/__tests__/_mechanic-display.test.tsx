import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { MechanicDisplay } from "../_mechanic-display";

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

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: () => null,
}));

const mechanic = { id: "m-1", full_name: "Бат", avatar_url: null };

describe("MechanicDisplay", () => {
  it("renders the mechanic badge in badge variant", () => {
    render(
      <MechanicDisplay
        variant="badge"
        workOrderId="wo-1"
        mechanic={mechanic}
      />,
    );
    expect(screen.getByText("Бат")).toBeTruthy();
  });

  it("renders an empty placeholder without a mechanic in badge variant", () => {
    render(
      <MechanicDisplay variant="badge" workOrderId="wo-1" mechanic={null} />,
    );
    expect(screen.queryByText("Бат")).toBeNull();
  });

  it("renders the mechanic, helpers and assign trigger in row variant", () => {
    render(
      <MechanicDisplay
        variant="row"
        workOrderId="wo-1"
        mechanic={mechanic}
        helpers={[{ id: "h-1", full_name: "Цэцэг", avatar_url: null }]}
        allMechanics={[{ id: "m-2", full_name: "Нара", avatar_url: null }]}
        onAssignMechanic={vi.fn()}
        onAddHelper={vi.fn()}
      />,
    );
    expect(screen.getByText("Бат")).toBeTruthy();
    expect(screen.getByText("Цэцэг")).toBeTruthy();
    // Lead mechanic is set, so the drawer trigger says "change"
    expect(screen.getByRole("button", { name: "changeMechanic" })).toBeTruthy();
  });

  it("does not render helpers or the assign trigger in preview variant", () => {
    render(
      <MechanicDisplay
        variant="row"
        rowVariant="preview"
        workOrderId="wo-1"
        mechanic={mechanic}
        helpers={[{ id: "h-1", full_name: "Цэцэг", avatar_url: null }]}
        allMechanics={[{ id: "m-2", full_name: "Нара", avatar_url: null }]}
        onAssignMechanic={vi.fn()}
        onAddHelper={vi.fn()}
      />,
    );
    expect(screen.getByText("Бат")).toBeTruthy();
    expect(screen.queryByText("Цэцэг")).toBeNull();
    expect(screen.queryByRole("button", { name: "assignMechanic" })).toBeNull();
  });

  it("hides the assign trigger when no callbacks are provided", () => {
    render(
      <MechanicDisplay
        variant="row"
        workOrderId="wo-1"
        mechanic={mechanic}
        allMechanics={[{ id: "m-2", full_name: "Нара", avatar_url: null }]}
      />,
    );
    expect(screen.queryByRole("button", { name: "assignMechanic" })).toBeNull();
  });
});
