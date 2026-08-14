import { act, fireEvent, screen } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { MechanicCombobox } from "@/components/mechanic-combobox";
import type { MechanicPickerOption } from "@/lib/types/mechanic";
import { render } from "@/test/test-utils";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

const addDrawerState = vi.hoisted(() => ({
  open: false,
  onOpenChange: null as null | ((open: boolean) => void),
}));
vi.mock("@/components/new-mechanic-drawer", () => ({
  NewMechanicDrawer: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    addDrawerState.open = open;
    addDrawerState.onOpenChange = onOpenChange;
    return open ? <div data-testid="new-mechanic-drawer" /> : null;
  },
}));

const mechanics: MechanicPickerOption[] = [
  { id: "m-1", full_name: "Бат", current_jobs: 2 },
  { id: "m-2", full_name: "Нара", current_jobs: 0 },
];

describe("MechanicCombobox", () => {
  it("calls onSelect when a mechanic is clicked in single mode", () => {
    const onSelect = vi.fn();
    render(<MechanicCombobox mechanics={mechanics} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Бат"));
    expect(onSelect).toHaveBeenCalledWith("m-1");
  });

  it("shows active job counts next to mechanics", () => {
    render(<MechanicCombobox mechanics={mechanics} onSelect={vi.fn()} />);
    expect(screen.getByText("2 active jobs")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("deselects when allowDeselect is set and the selected mechanic is clicked", () => {
    const onSelect = vi.fn();
    render(
      <MechanicCombobox
        mechanics={mechanics}
        selectedId="m-1"
        allowDeselect
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("Бат"));
    expect(onSelect).toHaveBeenCalledWith("");
  });

  it("toggles mechanics and sets the lead in multi-select mode", () => {
    const onToggle = vi.fn();
    const onSetLead = vi.fn();
    render(
      <MechanicCombobox
        mechanics={mechanics}
        selectedIds={["m-1"]}
        leadId={null}
        onToggle={onToggle}
        onSetLead={onSetLead}
      />,
    );
    fireEvent.click(screen.getByText("Нара"));
    expect(onToggle).toHaveBeenCalledWith("m-2");

    // Crown action appears for selected non-lead mechanics
    const crown = screen.getByTitle("Set as lead mechanic");
    fireEvent.click(crown);
    expect(onSetLead).toHaveBeenCalledWith("m-1");
  });

  it("shows the Lead badge for the lead mechanic", () => {
    render(
      <MechanicCombobox
        mechanics={mechanics}
        selectedIds={["m-1"]}
        leadId="m-1"
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Lead")).toBeInTheDocument();
  });

  it("filters by search query and shows the no-results message", () => {
    render(<MechanicCombobox mechanics={mechanics} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Search mechanics..."), {
      target: { value: "нар" },
    });
    expect(screen.getByText("Нара")).toBeInTheDocument();
    expect(screen.queryByText("Бат")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search mechanics..."), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No mechanics found")).toBeInTheDocument();
  });

  it("renders the empty state when there are no mechanics", () => {
    const { container } = render(
      <MechanicCombobox mechanics={[]} onSelect={vi.fn()} />,
    );
    expect(container.querySelector(".lucide-users")).toBeInTheDocument();
  });

  it("opens the add-mechanic drawer and notifies when it closes", async () => {
    const onMechanicAdded = vi.fn();
    render(
      <MechanicCombobox
        mechanics={mechanics}
        onSelect={vi.fn()}
        onMechanicAdded={onMechanicAdded}
      />,
    );
    fireEvent.click(screen.getByText("Add mechanic"));
    expect(addDrawerState.open).toBe(true);

    await act(async () => {
      addDrawerState.onOpenChange?.(false);
    });
    expect(onMechanicAdded).toHaveBeenCalled();
  });
});
