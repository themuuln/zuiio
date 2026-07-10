/**
 * E2E API response fixtures — deterministic mock data matching real API shapes.
 *
 * Every fixture factory accepts a `Partial<>` override for test-specific tweaking.
 * All IDs come from supabase/seed-e2e.ts seed IDs to ensure consistency
 * between seeded data and mocked responses.
 */

// ─── Seed IDs (mirrors supabase/seed-e2e.ts) ──────────────────────────────

export const SEED = {
  orgId: "e2e-00000000-0000-0000-0000-000000000001",
  mechanics: {
    bat: { id: "e2e-00000000-0000-0000-0000-000000000010", name: "Б. Бат" },
    dorj: { id: "e2e-00000000-0000-0000-0000-000000000011", name: "Д. Дорж" },
    gantulga: {
      id: "e2e-00000000-0000-0000-0000-000000000012",
      name: "Г. Гантулга",
    },
  },
  customers: {
    bayar: {
      id: "e2e-00000000-0000-0000-0000-000000000020",
      name: "Б. Баяр",
      phone: "99112233",
    },
    saraa: {
      id: "e2e-00000000-0000-0000-0000-000000000021",
      name: "С. Сарантуяа",
      phone: "99112234",
    },
    enkhbold: {
      id: "e2e-00000000-0000-0000-0000-000000000022",
      name: "Э. Энхболд",
      phone: "99112235",
    },
  },
  vehicles: {
    prius: {
      id: "e2e-00000000-0000-0000-0000-000000000030",
      plate: "45-99 УБХ",
      make: "Toyota",
      model: "Prius",
      year: 2020,
    },
    rx350: {
      id: "e2e-00000000-0000-0000-0000-000000000031",
      plate: "01-23 УБА",
      make: "Lexus",
      model: "RX 350",
      year: 2022,
    },
    porter: {
      id: "e2e-00000000-0000-0000-0000-000000000032",
      plate: "77-45 УБК",
      make: "Hyundai",
      model: "Porter",
      year: 2021,
    },
  },
  workOrders: {
    bay1: {
      id: "e2e-00000000-0000-0000-0000-000000000040",
      bay_number: 1,
      status: "in_progress",
      mechanic_id: "e2e-00000000-0000-0000-0000-000000000010",
    },
    bay2: {
      id: "e2e-00000000-0000-0000-0000-000000000041",
      bay_number: 2,
      status: "waiting_for_parts",
      mechanic_id: "e2e-00000000-0000-0000-0000-000000000011",
    },
    bay3: {
      id: "e2e-00000000-0000-0000-0000-000000000042",
      bay_number: 3,
      status: "in_progress",
      mechanic_id: "e2e-00000000-0000-0000-0000-000000000012",
    },
  },
  appointments: {
    apt1: "e2e-00000000-0000-0000-0000-000000000101",
  },
  expenses: {
    exp1: "e2e-00000000-0000-0000-0000-000000000201",
    category1: "e2e-00000000-0000-0000-0000-000000000202",
  },
  estimates: {
    est1: "e2e-00000000-0000-0000-0000-000000000301",
  },
  services: {
    svc1: "e2e-00000000-0000-0000-0000-000000000401",
  },
  serviceReminders: {
    sch1: "e2e-00000000-0000-0000-0000-000000000501",
  },
  cashRegister: {
    session1: "e2e-00000000-0000-0000-0000-000000000601",
  },
  inventory: {
    part1: "e2e-00000000-0000-0000-0000-000000000701",
    supplier1: "e2e-00000000-0000-0000-0000-000000000702",
  },
  reports: {
    report1: "e2e-00000000-0000-0000-0000-000000000801",
  },
  settings: {
    branch1: "e2e-00000000-0000-0000-0000-000000000901",
  },
  organization: {
    member1: "e2e-00000000-0000-0000-0000-000000000A01",
  },
} as const;

// ─── Bay View ─────────────────────────────────────────────────────────────

export interface BayFixture {
  bay_number: number;
  work_order_id: string | null;
  status: "in_progress" | "waiting_for_parts" | "empty";
  vehicle_plate: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  mechanic_name: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  services: Array<{ name: string; price: number }>;
  parts: Array<{ name: string; quantity: number }>;
  elapsed_minutes: number | null;
}

export interface BayViewResponse {
  bays: BayFixture[];
  kpi: {
    total_bays: number;
    occupied: number;
    empty: number;
    utilization_percent: number;
  };
}

export function bayViewFixture(
  overrides?: Partial<BayViewResponse>,
): BayViewResponse {
  const default_: BayViewResponse = {
    bays: [
      {
        bay_number: 1,
        work_order_id: SEED.workOrders.bay1.id,
        status: "in_progress",
        vehicle_plate: SEED.vehicles.prius.plate,
        vehicle_make: SEED.vehicles.prius.make,
        vehicle_model: SEED.vehicles.prius.model,
        mechanic_name: SEED.mechanics.bat.name,
        customer_name: SEED.customers.bayar.name,
        customer_phone: SEED.customers.bayar.phone,
        services: [{ name: "Engine oil change", price: 45000 }],
        parts: [],
        elapsed_minutes: 45,
      },
      {
        bay_number: 2,
        work_order_id: SEED.workOrders.bay2.id,
        status: "waiting_for_parts",
        vehicle_plate: SEED.vehicles.rx350.plate,
        vehicle_make: SEED.vehicles.rx350.make,
        vehicle_model: SEED.vehicles.rx350.model,
        mechanic_name: SEED.mechanics.dorj.name,
        customer_name: SEED.customers.saraa.name,
        customer_phone: SEED.customers.saraa.phone,
        services: [{ name: "Brake pad replacement", price: 120000 }],
        parts: [],
        elapsed_minutes: 30,
      },
      {
        bay_number: 3,
        work_order_id: SEED.workOrders.bay3.id,
        status: "in_progress",
        vehicle_plate: SEED.vehicles.porter.plate,
        vehicle_make: SEED.vehicles.porter.make,
        vehicle_model: SEED.vehicles.porter.model,
        mechanic_name: SEED.mechanics.gantulga.name,
        customer_name: SEED.customers.enkhbold.name,
        customer_phone: SEED.customers.enkhbold.phone,
        services: [{ name: "Diagnostic", price: 35000 }],
        parts: [],
        elapsed_minutes: 12,
      },
      // Empty bays 4-6
      {
        bay_number: 4,
        work_order_id: null,
        status: "empty",
        vehicle_plate: null,
        vehicle_make: null,
        vehicle_model: null,
        mechanic_name: null,
        customer_name: null,
        customer_phone: null,
        services: [],
        parts: [],
        elapsed_minutes: null,
      },
      {
        bay_number: 5,
        work_order_id: null,
        status: "empty",
        vehicle_plate: null,
        vehicle_make: null,
        vehicle_model: null,
        mechanic_name: null,
        customer_name: null,
        customer_phone: null,
        services: [],
        parts: [],
        elapsed_minutes: null,
      },
      {
        bay_number: 6,
        work_order_id: null,
        status: "empty",
        vehicle_plate: null,
        vehicle_make: null,
        vehicle_model: null,
        mechanic_name: null,
        customer_name: null,
        customer_phone: null,
        services: [],
        parts: [],
        elapsed_minutes: null,
      },
    ],
    kpi: {
      total_bays: 6,
      occupied: 3,
      empty: 3,
      utilization_percent: 50,
    },
  };

  return overrides ? { ...default_, ...overrides } : default_;
}

/**
 * Create a single bay fixture for targeted tests.
 */
export function bayFixture(overrides?: Partial<BayFixture>): BayFixture {
  return {
    bay_number: 1,
    work_order_id: SEED.workOrders.bay1.id,
    status: "in_progress",
    vehicle_plate: SEED.vehicles.prius.plate,
    vehicle_make: SEED.vehicles.prius.make,
    vehicle_model: SEED.vehicles.prius.model,
    mechanic_name: SEED.mechanics.bat.name,
    customer_name: SEED.customers.bayar.name,
    customer_phone: SEED.customers.bayar.phone,
    services: [{ name: "Engine oil change", price: 45000 }],
    parts: [],
    elapsed_minutes: 45,
    ...overrides,
  };
}

// ─── Work Order Detail ────────────────────────────────────────────────────

export interface WorkOrderDetailFixture {
  id: string;
  bay_number: number;
  status: string;
  mechanic_id: string;
  mechanic_name: string;
  vehicle: { plate: string; make: string; model: string; year: number };
  customer: { id: string; name: string; phone: string };
  services: Array<{
    id: string;
    name: string;
    base_price: number;
    final_price: number;
    quantity: number;
  }>;
  parts: Array<{
    id: string;
    part_name: string;
    part_number: string;
    quantity: number;
    unit_price: number;
    final_price: number;
  }>;
  helper_ids: string[];
  started_at: string;
  notes: string | null;
}

export function workOrderDetailFixture(
  overrides?: Partial<WorkOrderDetailFixture>,
): WorkOrderDetailFixture {
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();

  return {
    id: SEED.workOrders.bay1.id,
    bay_number: 1,
    status: "in_progress",
    mechanic_id: SEED.mechanics.bat.id,
    mechanic_name: SEED.mechanics.bat.name,
    vehicle: {
      plate: SEED.vehicles.prius.plate,
      make: SEED.vehicles.prius.make,
      model: SEED.vehicles.prius.model,
      year: SEED.vehicles.prius.year,
    },
    customer: {
      id: SEED.customers.bayar.id,
      name: SEED.customers.bayar.name,
      phone: SEED.customers.bayar.phone,
    },
    services: [
      {
        id: "e2e-service-001",
        name: "Engine oil change",
        base_price: 45000,
        final_price: 45000,
        quantity: 1,
      },
    ],
    parts: [],
    helper_ids: [],
    started_at: hourAgo,
    notes: "Engine oil change + filter",
    ...overrides,
  };
}

// ─── Work Order List Item ────────────────────────────────────────────────

export interface WorkOrderListItemFixture {
  id: string;
  status: string;
  created_at: string;
  mechanic_id: string | null;
  mechanic: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  customer: { first_name: string; last_name: string | null } | null;
  vehicle: {
    plate_number: string;
    make: string | null;
    model: string | null;
  } | null;
  grand_total?: number;
  services_cost?: number;
  parts_cost?: number;
}

export function workOrderListItemFixture(
  overrides?: Partial<WorkOrderListItemFixture>,
): WorkOrderListItemFixture {
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  return {
    id: SEED.workOrders.bay1.id,
    status: "in-progress",
    created_at: hourAgo,
    mechanic_id: SEED.mechanics.bat.id,
    mechanic: {
      id: SEED.mechanics.bat.id,
      full_name: SEED.mechanics.bat.name,
      avatar_url: null,
    },
    customer: {
      first_name: SEED.customers.bayar.name.split(" ")[0],
      last_name: SEED.customers.bayar.name.split(" ")[1] ?? null,
    },
    vehicle: {
      plate_number: SEED.vehicles.prius.plate,
      make: SEED.vehicles.prius.make,
      model: SEED.vehicles.prius.model,
    },
    grand_total: 150000,
    services_cost: 100000,
    parts_cost: 50000,
    ...overrides,
  };
}

// ─── Appointment ─────────────────────────────────────────────────────────

export interface AppointmentFixture {
  id: string;
  vehicle_plate: string;
  customer_name: string;
  scheduled_at: string;
  status: string;
  service_type: string;
  notes: string | null;
  mechanic_name: string | null;
  branch_id: string | null;
}

export function appointmentFixture(
  overrides?: Partial<AppointmentFixture>,
): AppointmentFixture {
  const tomorrow = new Date(Date.now() + 86400_000);
  tomorrow.setHours(10, 0, 0, 0);
  return {
    id: SEED.appointments.apt1,
    vehicle_plate: SEED.vehicles.prius.plate,
    customer_name: SEED.customers.bayar.name,
    scheduled_at: tomorrow.toISOString(),
    status: "scheduled",
    service_type: "Oil Change",
    notes: null,
    mechanic_name: SEED.mechanics.bat.name,
    branch_id: null,
    ...overrides,
  };
}

// ─── Expense With Category ───────────────────────────────────────────────

export interface ExpenseWithCategoryFixture {
  id: string;
  description: string;
  amount: number;
  date: string;
  category_id: string;
  category: { id: string; name: string; color: string | null } | null;
  is_paid: boolean;
  receipt_url: string | null;
  notes: string | null;
  branch_id: string | null;
}

export function expenseWithCategoryFixture(
  overrides?: Partial<ExpenseWithCategoryFixture>,
): ExpenseWithCategoryFixture {
  return {
    id: SEED.expenses.exp1,
    description: "Office supplies",
    amount: 150000,
    date: new Date().toISOString().split("T")[0],
    category_id: SEED.expenses.category1,
    category: {
      id: SEED.expenses.category1,
      name: "Supplies",
      color: "#6366f1",
    },
    is_paid: true,
    receipt_url: null,
    notes: null,
    branch_id: null,
    ...overrides,
  };
}

// ─── Estimate List Item ──────────────────────────────────────────────────

export interface EstimateListItemFixture {
  id: string;
  status: string;
  customer_name: string;
  vehicle_plate: string;
  total: number;
  valid_until: string;
  created_at: string;
  notes: string | null;
}

export function estimateListItemFixture(
  overrides?: Partial<EstimateListItemFixture>,
): EstimateListItemFixture {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 86400_000);
  return {
    id: SEED.estimates.est1,
    status: "draft",
    customer_name: SEED.customers.bayar.name,
    vehicle_plate: SEED.vehicles.prius.plate,
    total: 250000,
    valid_until: validUntil.toISOString().split("T")[0],
    created_at: now.toISOString(),
    notes: null,
    ...overrides,
  };
}

// ─── Finance Overview ────────────────────────────────────────────────────

export interface FinanceOverviewFixture {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  invoice_count: number;
  pending_invoices: number;
  paid_invoices: number;
  period: string;
}

export function financeOverviewFixture(
  overrides?: Partial<FinanceOverviewFixture>,
): FinanceOverviewFixture {
  return {
    total_revenue: 5000000,
    total_expenses: 1500000,
    net_profit: 3500000,
    invoice_count: 12,
    pending_invoices: 3,
    paid_invoices: 9,
    period: "month",
    ...overrides,
  };
}

// ─── Service Catalog ─────────────────────────────────────────────────────

export interface ServiceCatalogFixture {
  id: string;
  name: string;
  category: string;
  base_price: number;
  estimated_minutes: number;
  is_active: boolean;
  description: string | null;
}

export function serviceCatalogFixture(
  overrides?: Partial<ServiceCatalogFixture>,
): ServiceCatalogFixture {
  return {
    id: SEED.services.svc1,
    name: "Oil Change",
    category: "Maintenance",
    base_price: 150000,
    estimated_minutes: 30,
    is_active: true,
    description: null,
    ...overrides,
  };
}

// ─── Service Schedule (Reminder) ─────────────────────────────────────────

export interface ServiceScheduleFixture {
  id: string;
  vehicle_id: string;
  vehicle_plate: string;
  service_name: string;
  interval_km: number | null;
  interval_months: number | null;
  last_service_date: string | null;
  next_due_date: string | null;
  next_due_km: number | null;
  status: string;
  contact_status: string | null;
  notes: string | null;
}

export function serviceScheduleFixture(
  overrides?: Partial<ServiceScheduleFixture>,
): ServiceScheduleFixture {
  return {
    id: SEED.serviceReminders.sch1,
    vehicle_id: SEED.vehicles.prius.id,
    vehicle_plate: SEED.vehicles.prius.plate,
    service_name: "Oil Change",
    interval_km: null,
    interval_months: 6,
    last_service_date: null,
    next_due_date: new Date(Date.now() + 180 * 86400_000)
      .toISOString()
      .split("T")[0],
    next_due_km: null,
    status: "active",
    contact_status: null,
    notes: null,
    ...overrides,
  };
}

// ─── Cash Register ───────────────────────────────────────────────────────

export interface CashRegisterEntryFixture {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  work_order_id: string | null;
}

export interface CashRegisterSessionFixture {
  id: string;
  status: string;
  opening_balance: number;
  closing_balance: number | null;
  total_sales: number;
  total_cash_out: number;
  total_refunds: number;
  opened_at: string;
  closed_at: string | null;
  branch_id: string | null;
  entries: CashRegisterEntryFixture[];
}

export function cashRegisterSessionFixture(
  overrides?: Partial<CashRegisterSessionFixture>,
): CashRegisterSessionFixture {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600_000);
  return {
    id: SEED.cashRegister.session1,
    status: "open",
    opening_balance: 500000,
    closing_balance: null,
    total_sales: 350000,
    total_cash_out: 50000,
    total_refunds: 0,
    opened_at: hourAgo.toISOString(),
    closed_at: null,
    branch_id: null,
    entries: [
      {
        id: "entry-sale-1",
        type: "sale",
        amount: 350000,
        description: "Work order payment",
        created_at: now.toISOString(),
        work_order_id: SEED.workOrders.bay1.id,
      },
      {
        id: "entry-cashout-1",
        type: "cash_out",
        amount: 50000,
        description: "Office supplies",
        created_at: now.toISOString(),
        work_order_id: null,
      },
    ],
    ...overrides,
  };
}

// ─── Inventory Part ──────────────────────────────────────────────────────

export interface InventoryPartFixture {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  quantity_on_hand: number;
  min_quantity: number;
  supplier_id: string | null;
  is_active: boolean;
}

export function inventoryPartFixture(
  overrides?: Partial<InventoryPartFixture>,
): InventoryPartFixture {
  return {
    id: SEED.inventory.part1,
    name: "Oil Filter",
    sku: "OF-001",
    category: "Filters",
    unit_price: 25000,
    quantity_on_hand: 50,
    min_quantity: 10,
    supplier_id: SEED.inventory.supplier1,
    is_active: true,
    ...overrides,
  };
}

// ─── Report Data ─────────────────────────────────────────────────────────

export interface ReportDataFixture {
  total_revenue: number;
  total_work_orders: number;
  avg_order_value: number;
  mechanics: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
}

export function reportDataFixture(
  overrides?: Partial<ReportDataFixture>,
): ReportDataFixture {
  return {
    total_revenue: 8500000,
    total_work_orders: 45,
    avg_order_value: 188889,
    mechanics: [
      {
        id: SEED.mechanics.bat.id,
        name: SEED.mechanics.bat.name,
        revenue: 4200000,
        orders: 22,
      },
      {
        id: SEED.mechanics.dorj.id,
        name: SEED.mechanics.dorj.name,
        revenue: 4300000,
        orders: 23,
      },
    ],
    ...overrides,
  };
}

// ─── Mechanic Time Status ────────────────────────────────────────────────

export interface MechanicTimeStatusFixture {
  clocked_in: boolean;
  clock_in_time: string | null;
  today_hours: number;
  today_earnings: number;
}

export function mechanicTimeStatusFixture(
  overrides?: Partial<MechanicTimeStatusFixture>,
): MechanicTimeStatusFixture {
  return {
    clocked_in: true,
    clock_in_time: new Date(Date.now() - 28800_000).toISOString(),
    today_hours: 8,
    today_earnings: 400000,
    ...overrides,
  };
}

// ─── Organization Detail ─────────────────────────────────────────────────

export interface OrganizationDetailFixture {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  subscription: { plan_type: string; status: string } | null;
}

export function organizationDetailFixture(
  overrides?: Partial<OrganizationDetailFixture>,
): OrganizationDetailFixture {
  return {
    id: SEED.orgId,
    name: "TOLOM E2E Test",
    slug: "tolom-e2e-test",
    settings: { currency: "MNT", timezone: "Asia/Ulaanbaatar" },
    subscription: { plan_type: "pro", status: "active" },
    ...overrides,
  };
}

// ─── Admin Me ────────────────────────────────────────────────────────────

export interface AdminMeFixture {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user_id: string;
}

export function adminMeFixture(
  overrides?: Partial<AdminMeFixture>,
): AdminMeFixture {
  return {
    isAdmin: true,
    isSuperAdmin: false,
    user_id: "e2e-admin-user-id",
    ...overrides,
  };
}
// ─── Customer ──────────────────────────────────────────────────────────────

export interface CustomerFixture {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  organization_id: string;
  created_at: string;
}

export function customerFixture(
  overrides?: Partial<CustomerFixture>,
): CustomerFixture {
  return {
    id: SEED.customers.bayar.id,
    full_name: SEED.customers.bayar.name,
    phone: SEED.customers.bayar.phone,
    email: null,
    organization_id: SEED.orgId,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── CRUD Mutation Response ───────────────────────────────────────────────

export interface CrudCreateResponse {
  id: string;
  [key: string]: unknown;
}

export function crudCreateResponse(
  overrides?: Partial<CrudCreateResponse>,
): CrudCreateResponse {
  return {
    id: "e2e-crud-00000000-0000-0000-0000-000000009999",
    ...overrides,
  };
}
// ─── Vehicle Model ─────────────────────────────────────────────────────────

export interface VehicleModelItem {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year_from: number | null;
  year_to: number | null;
  body_type: string | null;
  engine_type: string | null;
  organization_id: string;
  created_at: string;
}

export function vehicleModelFixture(
  overrides?: Partial<VehicleModelItem>,
): VehicleModelItem {
  return {
    id: "e2e-00000000-0000-0000-0000-000000000100",
    make: "Toyota",
    model: "Corolla",
    variant: "sedan",
    year_from: 2020,
    year_to: 2024,
    body_type: "sedan",
    engine_type: "gasoline",
    organization_id: SEED.orgId,
    created_at: "2024-01-15T08:00:00Z",
    ...overrides,
  };
}

// ─── Overview Dashboard ────────────────────────────────────────────────────

export interface OverviewDashboardFixture {
  summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    work_orders_count: number;
    completed_count: number;
    active_count: number;
  };
  recentWorkOrders: WorkOrderListItemFixture[];
}

export function overviewDashboardFixture(
  overrides?: Partial<OverviewDashboardFixture>,
): OverviewDashboardFixture {
  return {
    summary: {
      total_revenue: 12500000,
      total_expenses: 4200000,
      net_profit: 8300000,
      work_orders_count: 142,
      completed_count: 98,
      active_count: 12,
    },
    recentWorkOrders: [
      workOrderListItemFixture({ status: "in_progress" }),
      workOrderListItemFixture({
        id: "e2e-00000000-0000-0000-0000-000000000201",
        status: "completed",
      }),
      workOrderListItemFixture({
        id: "e2e-00000000-0000-0000-0000-000000000202",
        status: "new",
      }),
    ],
    ...overrides,
  };
}

// ─── Organization Member ──────────────────────────────────────────────────

export interface OrgMemberFixture {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export function orgMemberFixture(
  overrides?: Partial<OrgMemberFixture>,
): OrgMemberFixture {
  return {
    id: "e2e-00000000-0000-0000-0000-000000000200",
    user_id: SEED.mechanics.bat.id,
    organization_id: SEED.orgId,
    role: "mechanic",
    full_name: "E2E Mechanic",
    email: "mechanic@e2e.test",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}
