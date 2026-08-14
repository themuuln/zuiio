import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayCardProvider } from "../_bay-card-context";
import { BayCardOccupied } from "../_bay-card-occupied";
import type { BayCardWorkOrder } from "../_bay-card-types";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
      params ? `${key}[${Object.values(params).join("|")}]` : key,
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
  MechanicAvatarChip: () => <span data-testid="mechanic-chip" />,
}));

vi.mock("@/components/mechanic-picker-drawer", () => ({
  MechanicPickerDrawer: () => null,
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
    vehicle: {
      id: "v-1",
      plate_number: "5678УБА",
      make: "Toyota",
      model: "Prius",
      year: 2020,
    } as BayCardWorkOrder["vehicle"],
    mechanic: { id: "m-1", full_name: "Бат", avatar_url: null },
    helpers: [],
    customer_name: "Дорж",
    ...overrides,
  };
}

function renderOccupied(
  workOrder: BayCardWorkOrder,
  overrides: Partial<Parameters<typeof BayCardProvider>[0]["value"]> = {},
) {
  const value = {
    woId: workOrder.id,
    status: workOrder.status,
    isPending: false,
    isKanbanMode: false,
    mechanics: [],
    onStatusChange: vi.fn(),
    onOpenDetail: vi.fn(),
    ...overrides,
  };
  render(
    <BayCardProvider value={value}>
      <BayCardOccupied bay={{ bayNumber: 1, workOrder }} />
    </BayCardProvider>,
  );
  return { value };
}

describe("BayCardOccupied", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders vehicle, mechanic and customer data", () => {
    renderOccupied(makeWorkOrder());
    expect(screen.getByText("5678")).toBeTruthy();
    expect(screen.getByText("УБА")).toBeTruthy();
    expect(screen.getByText("Toyota Prius · 2020")).toBeTruthy();
    expect(screen.getByText("Бат")).toBeTruthy();
    expect(screen.getByText("Дорж")).toBeTruthy();
  });

  it("renders nothing without a work order", () => {
    const { container } = render(
      <BayCardProvider
        value={{
          woId: "",
          status: "",
          isPending: false,
          isKanbanMode: false,
          mechanics: [],
          onStatusChange: vi.fn(),
          onOpenDetail: vi.fn(),
        }}
      >
        <BayCardOccupied bay={{ bayNumber: 1, workOrder: null }} />
      </BayCardProvider>,
    );
    expect(container.querySelector("header")).toBeNull();
  });

  it("shows the stuck-over-time warning after 2 hours", () => {
    renderOccupied(makeWorkOrder({ started_at: "2026-08-09T07:30:00Z" }));
    expect(screen.getByRole("img", { name: "bayOverTime[2]" })).toBeTruthy();
  });

  it("shows the critical warning after 3 hours", () => {
    renderOccupied(makeWorkOrder({ started_at: "2026-08-09T06:50:00Z" }));
    expect(screen.getByRole("img", { name: "bayOverTime[3]" })).toBeTruthy();
  });

  it("does not show the warning for recent jobs", () => {
    renderOccupied(makeWorkOrder({ started_at: "2026-08-09T09:00:00Z" }));
    expect(screen.queryByRole("img", { name: /bayOverTime/ })).toBeNull();
  });

  it("shows a placeholder customer when missing", () => {
    renderOccupied(makeWorkOrder({ customer_name: null }));
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows the pending spinner when isPending", () => {
    renderOccupied(makeWorkOrder(), { isPending: true });
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });
});
