import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { StatusTimeline } from "../_status-timeline";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

const t = (key: string) => key;

describe("StatusTimeline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the service-mode empty state", () => {
    render(<StatusTimeline mode="service" history={[]} />);
    expect(screen.getByText("noServiceHistory")).toBeTruthy();
  });

  it("renders service history entries with services, total and mechanic", () => {
    render(
      <StatusTimeline
        mode="service"
        history={[
          {
            work_order_id: "wo-1",
            status: "Completed",
            created_at: "2026-08-09T08:00:00Z",
            complaint: "Oil leak",
            services: [{ name: "Oil change", price: 30000 }],
            parts: [],
            total: 30000,
            mechanic_name: "Бат",
            helpers: [],
          },
        ]}
      />,
    );
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(screen.getByText("Oil leak")).toBeTruthy();
    expect(screen.getByText("Oil change")).toBeTruthy();
    expect(screen.getByText("₮ 30,000")).toBeTruthy();
    expect(screen.getByText("Бат")).toBeTruthy();
  });

  it("renders parts with quantity and helper counts in status mode", () => {
    render(
      <StatusTimeline
        mode="status"
        statusHistory={[]}
        serviceHistory={[
          {
            work_order_id: "wo-1",
            status: "In Progress",
            created_at: "2026-08-09T08:00:00Z",
            complaint: null,
            services: [],
            parts: [{ name: "Oil filter", price: 15000, quantity: 2 }],
            total: 30000,
            mechanic_name: null,
            helpers: [{ id: "h-1", full_name: "Цэцэг" }],
          },
        ]}
        t={t}
      />,
    );
    expect(screen.getByText("Oil filter")).toBeTruthy();
    expect(screen.getByText("×2")).toBeTruthy();
    expect(screen.getByText("+1")).toBeTruthy();
  });

  it("shows the status-mode empty state", () => {
    render(
      <StatusTimeline
        mode="status"
        statusHistory={[]}
        serviceHistory={[]}
        t={t}
      />,
    );
    expect(screen.getByText("noHistoryYet")).toBeTruthy();
  });

  it("renders deduplicated status history with translated labels", () => {
    const base = "2026-08-09T09:30:00Z";
    render(
      <StatusTimeline
        mode="status"
        statusHistory={[
          {
            id: "h-1",
            work_order_id: "wo-1",
            status: "New",
            previous_status: null,
            created_at: base,
            notes: null,
          },
          {
            id: "h-2",
            work_order_id: "wo-1",
            status: "New",
            previous_status: null,
            created_at: "2026-08-09T09:40:00Z",
            notes: null,
          },
          {
            id: "h-3",
            work_order_id: "wo-1",
            status: "Diagnosing",
            previous_status: "New",
            created_at: "2026-08-09T09:50:00Z",
            notes: null,
          },
        ]}
        serviceHistory={[]}
        t={t}
      />,
    );
    expect(screen.getByText("statusNew")).toBeTruthy();
    expect(screen.getByText("statusDiagnosing")).toBeTruthy();
    // Deduplicated New entries collapse into one with a ×2 badge
    expect(screen.getByText("×2")).toBeTruthy();
    expect(screen.getByText(/30 мин өмнө/)).toBeTruthy();
  });

  it("renders the service history section inside status mode", () => {
    render(
      <StatusTimeline
        mode="status"
        statusHistory={[]}
        serviceHistory={[
          {
            work_order_id: "wo-9",
            status: "Completed",
            created_at: "2026-08-09T07:00:00Z",
            complaint: "Fixed",
            services: [{ name: "Brake pads", price: 50000 }],
            parts: [],
            total: 50000,
            mechanic_name: "Нара",
            helpers: [],
          },
        ]}
        t={t}
      />,
    );
    expect(screen.getByText("serviceHistory")).toBeTruthy();
    expect(screen.getByText("Brake pads")).toBeTruthy();
    expect(screen.getByText("Нара")).toBeTruthy();
  });
});
