import { screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { WorkOrderDetail } from "@/lib/types";
import { render } from "@/test/test-utils";
import { WorkOrderDocument } from "../work-order-document";

// Mock the react-pdf primitives as plain DOM elements so the document
// tree can be rendered and asserted with @testing-library/react.
vi.mock("@react-pdf/renderer", () => {
  const view =
    (testId: string) =>
    ({ children, style }: { children?: React.ReactNode; style?: unknown }) =>
      React.createElement(
        "div",
        { "data-testid": testId, "data-style": JSON.stringify(style) },
        children,
      );
  return {
    Document: view("pdf-document"),
    Page: view("pdf-page"),
    View: view("pdf-view"),
    Text: ({
      children,
      style,
    }: {
      children?: React.ReactNode;
      style?: unknown;
    }) =>
      React.createElement(
        "span",
        { "data-testid": "pdf-text", "data-style": JSON.stringify(style) },
        children,
      ),
    StyleSheet: { create: (styles: unknown) => styles },
  };
});

const ORG = { name: "UB Auto Service" };

function makeWorkOrder(overrides: Partial<WorkOrderDetail> = {}) {
  return {
    id: "wo-2026-0001",
    organization_id: "org-1",
    branch_id: "b1",
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    mechanic_id: null,
    status: "In Progress",
    complaint: "Engine noise",
    diagnosis: "Timing belt worn",
    description: null,
    notes: "Call before pickup",
    mechanic_notes: "Replaced belt and tensioner",
    diagnosis_label_id: "dl-1",
    bay_number: 3,
    queue_order: 1,
    odometer_at_service: 45231,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 10000,
    subtotal: 170000,
    total: 160000,
    completed_at: null,
    started_at: "2026-08-02T09:00:00Z",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    customer: {
      id: "cust-1",
      first_name: "Bat",
      last_name: "Erdene",
      phone: "+97699112233",
      email: "bat@example.com",
    },
    vehicle: {
      id: "veh-1",
      plate_number: "1234УБА",
      make: "Toyota",
      model: "Prius",
      year: 2019,
    },
    mechanic: null,
    helpers: [],
    services: [
      {
        id: "svc-1",
        service_name: "Oil Change",
        quantity: 1,
        unit_price: 55000,
        final_price: 50000,
        discount_amount: null,
        notes: null,
      },
      {
        id: "svc-2",
        service_name: "Belt Replacement",
        quantity: 1,
        unit_price: 75000,
        final_price: 70000,
        discount_amount: 5000,
        notes: "Labor included",
      },
    ],
    parts: [
      {
        id: "part-1",
        part_name: "Oil Filter",
        part_number: "OF-101",
        quantity: 1,
        unit_price: 26000,
        final_price: 25000,
      },
      {
        id: "part-2",
        part_name: "Drain Plug",
        part_number: null,
        quantity: 1,
        unit_price: 16000,
        final_price: 15000,
      },
    ],
    status_history: [],
    service_history: [],
    diagnosis_label: { id: "dl-1", name: "Engine" },
    ...overrides,
  } as unknown as WorkOrderDetail;
}

describe("WorkOrderDocument", () => {
  it("renders header, customer/vehicle/details and service/part rows", () => {
    render(
      <WorkOrderDocument
        workOrder={makeWorkOrder()}
        org={ORG}
        branch={{ address: "Bayangol District", phone: "+97670001111" }}
        locale="mn"
      />,
    );

    // Header
    expect(screen.getByText("UB Auto Service")).toBeInTheDocument();
    expect(screen.getByText("Bayangol District")).toBeInTheDocument();
    expect(screen.getByText("Tel: +97670001111")).toBeInTheDocument();
    expect(screen.getByText("АЖЛЫН ЗАХИАЛГА")).toBeInTheDocument();
    expect(screen.getByText("WO #WO-2026-")).toBeInTheDocument();
    expect(screen.getByText(/01 Aug 2026/)).toBeInTheDocument();
    expect(screen.getByText(/02 Aug 2026/)).toBeInTheDocument();

    // Customer / vehicle / details blocks
    expect(screen.getByText("Bat Erdene")).toBeInTheDocument();
    expect(screen.getByText("+97699112233")).toBeInTheDocument();
    expect(screen.getByText("bat@example.com")).toBeInTheDocument();
    expect(screen.getByText("1234УБА")).toBeInTheDocument();
    expect(screen.getByText("Toyota Prius 2019")).toBeInTheDocument();
    expect(screen.getByText("Гүйлтийн км: 45,231 km")).toBeInTheDocument();
    expect(screen.getByText("Бэй 3")).toBeInTheDocument();
    expect(screen.getByText("Engine")).toBeInTheDocument();

    // Complaint & diagnosis
    expect(screen.getByText("Engine noise")).toBeInTheDocument();
    expect(screen.getByText("Timing belt worn")).toBeInTheDocument();

    // Service rows
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Belt Replacement")).toBeInTheDocument();
    expect(screen.getByText("Labor included")).toBeInTheDocument();
    expect(screen.getByText("-₮5,000")).toBeInTheDocument();

    // Part rows
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("OF-101")).toBeInTheDocument();
    expect(screen.getByText("Drain Plug")).toBeInTheDocument();

    // Totals: services 50k+70k, parts 25k+15k, discount, grand total
    expect(screen.getByText("₮120,000")).toBeInTheDocument();
    expect(screen.getByText("₮40,000")).toBeInTheDocument();
    expect(screen.getByText("-₮10,000")).toBeInTheDocument();
    expect(screen.getByText("₮160,000")).toBeInTheDocument();

    // Mechanic notes + notes
    expect(screen.getByText("Replaced belt and tensioner")).toBeInTheDocument();
    expect(screen.getByText("Call before pickup")).toBeInTheDocument();

    // Footer
    expect(
      screen.getByText("UB Auto Service — WO #WO-2026-"),
    ).toBeInTheDocument();
  });

  it("colors the discount row destructively and the status with the status color", () => {
    render(
      <WorkOrderDocument workOrder={makeWorkOrder()} org={ORG} locale="en" />,
    );

    // "In Progress" → #8b5cf6
    expect(
      screen.getByText("In Progress").getAttribute("data-style"),
    ).toContain("#8b5cf6");
    // Discount row → colors.destructive
    expect(screen.getByText("-₮10,000").getAttribute("data-style")).toContain(
      "#dc2626",
    );
  });

  it("uses the settings currency for amounts", () => {
    render(
      <WorkOrderDocument
        workOrder={makeWorkOrder()}
        org={ORG}
        settings={{ default_currency: "USD" }}
        locale="en"
      />,
    );

    expect(screen.getByText("$55,000.00")).toBeInTheDocument();
    expect(screen.getByText("$160,000.00")).toBeInTheDocument();
  });

  it("handles a walk-in customer and empty services/parts", () => {
    render(
      <WorkOrderDocument
        workOrder={makeWorkOrder({
          customer: null,
          vehicle: null,
          services: [],
          parts: [],
          complaint: null,
          diagnosis: null,
          mechanic_notes: null,
          notes: null,
          started_at: null,
          completed_at: null,
          bay_number: null,
          odometer_at_service: null,
          diagnosis_label: null,
          discount_total: 0,
        })}
        org={ORG}
        locale="en"
      />,
    );

    // Walk-in placeholder instead of a customer name
    expect(screen.getByText("Walk-in Customer")).toBeInTheDocument();
    expect(screen.queryByText("Bat Erdene")).not.toBeInTheDocument();

    // No services/parts tables, no complaint/diagnosis, no discount row
    expect(screen.queryByText("Oil Change")).not.toBeInTheDocument();
    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    expect(screen.queryByText("Engine noise")).not.toBeInTheDocument();
    expect(screen.queryByText("-₮10,000")).not.toBeInTheDocument();

    // Zeroed totals still render (services 0 + parts 0)
    expect(screen.getAllByText("₮0").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.queryByText("Replaced belt and tensioner"),
    ).not.toBeInTheDocument();
  });
});
