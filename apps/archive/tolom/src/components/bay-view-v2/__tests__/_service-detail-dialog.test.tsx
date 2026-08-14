import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ServiceDetailDialog } from "../_service-detail-dialog";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

const entry = {
  work_order_id: "wo-1",
  status: "Completed",
  created_at: "2026-08-09T08:00:00Z",
  complaint: "Engine light",
  diagnosis: null,
  notes: null,
  services: [],
  parts: [{ name: "Spark plug", quantity: 4, price: 8000 }],
  total: 120000,
  mechanic_name: null,
  helpers: [],
};

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  service: { name: "Engine diagnostics", price: 88000 },
  entry,
};

describe("ServiceDetailDialog", () => {
  it("renders the service name, price and status", () => {
    render(<ServiceDetailDialog {...baseProps} />);
    expect(screen.getByText("Engine diagnostics")).toBeTruthy();
    expect(screen.getByText("88,000₮")).toBeTruthy();
    expect(screen.getByText("Completed")).toBeTruthy();
  });

  it("renders used parts with quantity and the work order total", () => {
    render(<ServiceDetailDialog {...baseProps} />);
    expect(screen.getByText("Spark plug")).toBeTruthy();
    expect(screen.getByText("×4")).toBeTruthy();
    expect(screen.getByText("8,000₮")).toBeTruthy();
    expect(screen.getByText("120,000 MNT")).toBeTruthy();
  });

  it("renders the complaint field", () => {
    render(<ServiceDetailDialog {...baseProps} />);
    expect(screen.getByText("Engine light")).toBeTruthy();
  });

  it("renders nothing without a service or entry", () => {
    const { container } = render(
      <ServiceDetailDialog {...baseProps} service={null} entry={null} />,
    );
    expect(container.querySelector("[data-slot='dialog-portal']")).toBeNull();
  });
});
