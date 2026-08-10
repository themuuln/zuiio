import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DrawerSidebar } from "../_drawer-sidebar";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
    useLocale: () => "mn",
  };
});

const mocks = vi.hoisted(() => {
  const mutateAsync = vi.fn();
  return { mutateAsync };
});

vi.mock("@zuiio/query", () => ({
  useOrgMutation: (config: Record<string, unknown>) => {
    const onSuccess = config.onSuccess as
      | ((data: unknown, vars: unknown) => void)
      | undefined;
    mocks.mutateAsync.mockImplementation(async (vars: unknown) => {
      onSuccess?.(undefined, vars);
    });
    return {
      mutateAsync: mocks.mutateAsync,
      mutate: vi.fn(),
      isPending: false,
    };
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/queries/keys", () => ({
  workOrderKeys: {
    all: (orgId: string) => ["organizations", orgId, "work-orders"],
  },
}));

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
  }: {
    mechanic: { full_name: string | null };
  }) => <span data-testid="mechanic-chip">{mechanic.full_name ?? "?"}</span>,
}));

let pickerProps: {
  open: boolean;
  onToggle: (id: string) => void;
} | null = null;

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: (props: {
    open: boolean;
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

const t = (key: string) => key;

const wo = {
  id: "wo-1",
  status: "In Progress",
  mechanic_id: "m-1",
  mechanic: { id: "m-1", full_name: "Бат", avatar_url: null },
  customer: {
    first_name: "Дорж",
    last_name: "Бат",
    phone: "99112233",
  },
  status_history: [],
  service_history: [],
  created_at: "2026-08-09T08:00:00Z",
  started_at: "2026-08-09T09:00:00Z",
  completed_at: null,
} as never;

const baseProps = {
  wo,
  allMechanics: [{ id: "m-2", full_name: "Нара", avatar_url: null }],
  helpers: [],
  orgId: "org-1",
  workOrderId: "wo-1",
  onShowCustomerPicker: vi.fn(),
  onAssignMechanic: vi.fn(),
  onHelpersChange: vi.fn(),
  t,
};

describe("DrawerSidebar", () => {
  it("renders the customer name, phone and change button", () => {
    const onShowCustomerPicker = vi.fn();
    render(
      <DrawerSidebar
        {...baseProps}
        onShowCustomerPicker={onShowCustomerPicker}
      />,
    );
    expect(screen.getByText("Дорж Бат")).toBeTruthy();
    expect(screen.getByText("99112233")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "changeCustomer" }));
    expect(onShowCustomerPicker).toHaveBeenCalledTimes(1);
  });

  it("shows the select-customer prompt when there is no customer", () => {
    const onShowCustomerPicker = vi.fn();
    render(
      <DrawerSidebar
        {...baseProps}
        wo={{ ...wo, customer: null }}
        onShowCustomerPicker={onShowCustomerPicker}
      />,
    );
    fireEvent.click(screen.getByText("selectCustomer"));
    expect(onShowCustomerPicker).toHaveBeenCalledTimes(1);
  });

  it("includes the assigned mechanic in the picker list even if not in allMechanics", () => {
    render(
      <DrawerSidebar
        {...baseProps}
        allMechanics={[{ id: "m-2", full_name: "Нара", avatar_url: null }]}
      />,
    );
    expect(screen.getByText("Бат")).toBeTruthy();
  });

  it("renders the timeline and vehicle info sections with dates", () => {
    render(<DrawerSidebar {...baseProps} />);
    expect(screen.getByText("statusTimeline")).toBeTruthy();
    expect(screen.getByText("Үүсгэсэн")).toBeTruthy();
    expect(screen.getByText("Эхэлсэн")).toBeTruthy();
    expect(screen.queryByText("Дууссан")).toBeNull();
  });

  it("adds a helper through the assign drawer and refreshes", async () => {
    const onHelpersChange = vi.fn();
    render(
      <DrawerSidebar
        {...baseProps}
        allMechanics={[
          { id: "m-1", full_name: "Бат", avatar_url: null },
          { id: "m-2", full_name: "Нара", avatar_url: null },
        ]}
        onHelpersChange={onHelpersChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "changeMechanic" }));
    expect(pickerProps?.open).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "toggle-m-2" }));
    await waitFor(() => expect(onHelpersChange).toHaveBeenCalledTimes(1));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ mechanic_id: "m-2" });
  });
});
