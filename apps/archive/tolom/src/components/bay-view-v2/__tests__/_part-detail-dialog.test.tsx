import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { PartDetailDialog } from "../_part-detail-dialog";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

const entry = {
  work_order_id: "wo-1",
  status: "In Progress",
  created_at: "2026-08-09T08:00:00Z",
  complaint: "Suspension noise",
  diagnosis: "Damaged bushing",
  notes: "Customer approved",
  services: [{ name: "Suspension check", price: 20000 }],
  parts: [],
  total: 30000,
  mechanic_name: "Бат",
  helpers: [{ id: "h-1", full_name: "Цэцэг" }],
};

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  part: { name: "Bushing kit", quantity: 2, price: 15000 },
  entry,
};

describe("PartDetailDialog", () => {
  it("renders part name, quantity, price and total", () => {
    render(<PartDetailDialog {...baseProps} />);
    expect(screen.getByText("Bushing kit")).toBeTruthy();
    expect(screen.getByText("×2")).toBeTruthy();
    expect(screen.getByText("15,000₮")).toBeTruthy();
    expect(screen.getByText("30,000₮")).toBeTruthy();
  });

  it("renders entry metadata, services and team", () => {
    render(<PartDetailDialog {...baseProps} />);
    expect(screen.getByText("In Progress")).toBeTruthy();
    expect(screen.getByText("Suspension check")).toBeTruthy();
    expect(screen.getByText("Suspension noise")).toBeTruthy();
    expect(screen.getByText("Бат")).toBeTruthy();
    expect(screen.getByText("Цэцэг")).toBeTruthy();
    expect(screen.getByText("30,000 MNT")).toBeTruthy();
  });

  it("hides quantity and total for a single-unit part", () => {
    render(
      <PartDetailDialog
        {...baseProps}
        part={{ name: "Bushing kit", quantity: 1, price: 15000 }}
      />,
    );
    expect(screen.queryByText("×2")).toBeNull();
    expect(screen.getByText("15,000₮")).toBeTruthy();
  });

  it("renders nothing without a part or entry", () => {
    const { container } = render(
      <PartDetailDialog {...baseProps} part={null} entry={null} />,
    );
    expect(container.querySelector("[data-slot='dialog-portal']")).toBeNull();
  });
});
