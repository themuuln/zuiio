import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { render } from "@/test/test-utils";
import { STATUS_TRANSLATION_KEYS } from "../../_constants";
import { TimelineCardV2 } from "../_sidebar";

// Map translation keys back to raw statuses so rendered text is greppable.
const t = (key: string) =>
  Object.entries(STATUS_TRANSLATION_KEYS).find(([, k]) => k === key)?.[0] ??
  key;

const REACHED_DOT = "bg-primary ring-4 ring-primary/10";
const UNREACHED_DOT = "border-2 border-border bg-background";

function statusDot(status: string): Element | null {
  const label = screen.getByText(status);
  return label.closest("li")?.querySelector("span.rounded-full") ?? null;
}

function makeWo(overrides: Partial<WorkOrderDetail> = {}): WorkOrderDetail {
  return {
    id: "wo-1",
    organization_id: "org-1",
    branch_id: null,
    customer_id: null,
    vehicle_id: "v1",
    mechanic_id: null,
    status: "In Progress",
    complaint: null,
    diagnosis: null,
    description: null,
    notes: null,
    mechanic_notes: null,
    diagnosis_label_id: null,
    bay_number: 3,
    queue_order: 0,
    odometer_at_service: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    subtotal: 0,
    total: 0,
    completed_at: null,
    started_at: null,
    created_at: "2026-08-01T09:00:00",
    updated_at: "2026-08-01T09:00:00",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    customer: null,
    vehicle: {
      id: "v1",
      plate_number: "ABC 1234",
    } as WorkOrderDetail["vehicle"],
    mechanic: null,
    helpers: [],
    services: [],
    parts: [],
    status_history: [],
    service_history: [],
    nuat_enabled: false,
    ...overrides,
  };
}

describe("TimelineCardV2", () => {
  it("marks every step up to the current status as reached even when history skipped intermediate entries", () => {
    render(
      <TimelineCardV2
        t={t}
        wo={makeWo({
          status: "Ready for Pickup",
          status_history: [
            {
              id: "h1",
              status: "New",
              created_at: "2026-08-01T09:00:00",
            } as WorkOrderDetail["status_history"][number],
            {
              id: "h2",
              status: "Ready for Pickup",
              created_at: "2026-08-01T15:00:00",
            } as WorkOrderDetail["status_history"][number],
          ],
        })}
      />,
    );

    for (const status of [
      "New",
      "Diagnosing",
      "In Progress",
      "Ready for Pickup",
    ]) {
      expect(statusDot(status)?.className).toContain(REACHED_DOT);
    }
    // Completed is still ahead — must stay unreached.
    expect(statusDot("Completed")?.className).toContain(UNREACHED_DOT);
  });

  it("renders timestamps only for steps present in the status history", () => {
    render(
      <TimelineCardV2
        t={t}
        wo={makeWo({
          status: "Ready for Pickup",
          status_history: [
            {
              id: "h1",
              status: "New",
              created_at: "2026-08-01T09:00:00",
            } as WorkOrderDetail["status_history"][number],
          ],
        })}
      />,
    );

    // Only the steps recorded in history get a time line under them.
    const timeLines = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timeLines).toHaveLength(1);
  });

  it("falls back to history-derived steps when the current status is not in the order", () => {
    render(
      <TimelineCardV2
        t={t}
        wo={makeWo({
          status: "Cancelled",
          status_history: [
            {
              id: "h1",
              status: "New",
              created_at: "2026-08-01T09:00:00",
            } as WorkOrderDetail["status_history"][number],
            {
              id: "h2",
              status: "Diagnosing",
              created_at: "2026-08-01T10:00:00",
            } as WorkOrderDetail["status_history"][number],
          ],
        })}
      />,
    );

    expect(statusDot("New")?.className).toContain(REACHED_DOT);
    expect(statusDot("Diagnosing")?.className).toContain(REACHED_DOT);
    // Never visited and the current status is not in the order — must stay gray.
    expect(statusDot("In Progress")?.className).toContain(UNREACHED_DOT);
    expect(statusDot("Completed")?.className).toContain(UNREACHED_DOT);
  });
});
