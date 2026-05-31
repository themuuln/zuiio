// biome-ignore lint/style/noRestrictedImports: factories require full Database typings
import type { Database } from "@/lib/database.types";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
type WorkOrderRow = Database["public"]["Tables"]["work_orders"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type InventoryMovementRow =
  Database["public"]["Tables"]["inventory_movements"]["Row"];

let autoId = 1;
function nextId(): string {
  return String(autoId++);
}

export function createMockCustomer(
  overrides?: Partial<CustomerRow>,
): CustomerRow {
  const id = nextId();
  return {
    id,
    organization_id: "org-1",
    branch_id: null,
    first_name: "Test",
    last_name: "Customer",
    full_name: null,
    phone: "+97699111111",
    email: "test@example.com",
    address: null,
    company_name: null,
    contact_person: null,
    type: null,
    source: null,
    tags: null,
    notes: null,
    customer_user_id: null,
    total_visits: 0,
    last_visit_at: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    ...overrides,
  } as CustomerRow;
}

export function createMockVehicle(overrides?: Partial<VehicleRow>): VehicleRow {
  const id = nextId();
  return {
    id,
    organization_id: "org-1",
    branch_id: null,
    customer_id: null,
    plate_number: "001УБА",
    make: "Toyota",
    model: "Land Cruiser 200",
    year: 2020,
    vin: "JTMHV05J004123456",
    color: null,
    engine: null,
    fuel_type: null,
    transmission: null,
    drivetrain: null,
    body_type: null,
    trim: null,
    type: null,
    chassis_number: null,
    odometer: null,
    inspection_notes: null,
    tags: null,
    notes: null,
    total_visits: null,
    last_visit_at: null,
    last_visit_date: null,
    license_expiry: null,
    license_expiry_at: null,
    next_service_at: null,
    next_service_date: null,
    last_service_branch_id: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    ...overrides,
  } as VehicleRow;
}

export function createMockWorkOrder(
  overrides?: Partial<WorkOrderRow> & {
    services?: Array<Record<string, unknown>>;
    parts?: Array<Record<string, unknown>>;
    status_history?: Array<Record<string, unknown>>;
  },
): WorkOrderRow & {
  services: Array<Record<string, unknown>>;
  parts: Array<Record<string, unknown>>;
  status_history: Array<Record<string, unknown>>;
} {
  const id = nextId();
  return {
    id,
    organization_id: "org-1",
    branch_id: null,
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    mechanic_id: "mech-1",
    status: "New",
    complaint: null,
    description: null,
    diagnosis: null,
    notes: null,
    mechanic_notes: null,
    bay_number: null,
    queue_order: 0,
    diagnosis_label_id: null,
    odometer_at_service: null,
    subtotal: 0,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    total: 0,
    started_at: null,
    completed_at: null,
    loss_reason: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    services: [],
    parts: [],
    status_history: [],
    ...overrides,
  };
}

export function createMockOrganization(
  overrides?: Partial<OrganizationRow> & { branch_limit?: number },
): OrganizationRow & { branch_limit: number } {
  const id = nextId();
  return {
    id,
    name: "Test Auto Shop",
    slug: "test-auto-shop",
    is_active: true,
    logo_url: null,
    settings: {},
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    created_by: null,
    updated_by: null,
    deleted_at: null,
    branch_limit: 1,
    ...overrides,
  } as OrganizationRow & { branch_limit: number };
}

export function createMockCustomerList(
  count: number,
  overrides?: Partial<CustomerRow>,
): CustomerRow[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCustomer({
      ...overrides,
      id: `cust-${i + 1}`,
      first_name: `Customer ${i + 1}`,
    }),
  );
}

export function createMockInventoryMovement(
  overrides?: Partial<InventoryMovementRow>,
): InventoryMovementRow {
  const id = nextId();
  return {
    id,
    organization_id: "org-1",
    branch_id: null,
    part_id: "part-1",
    movement_type: "purchase",
    quantity: 1,
    unit_cost: 1000,
    unit_price: null,
    reference_type: null,
    reference_id: null,
    notes: null,
    created_at: "2025-01-01T00:00:00.000Z",
    created_by: null,
    ...overrides,
  };
}
