/**
 * Playwright route mocking helpers for E2E tests.
 *
 * Each function sets up a `page.route()` interceptor that returns fixture data
 * instead of hitting real Supabase. Fixtures are imported from ../fixtures.
 *
 * Usage in a test:
 *   test("shows bays", async ({ page }) => {
 *     await mockBayView(page);
 *     await mockWorkOrderDetail(page, SEED.workOrders.bay1.id);
 *     await page.goto("/dashboard/bay-view");
 *     // ... assertions against fixture data
 *   });
 */

import type { Page } from "@playwright/test";
import {
  type AppointmentFixture,
  adminMeFixture,
  appointmentFixture,
  type BayViewResponse,
  bayViewFixture,
  type CashRegisterSessionFixture,
  type CustomerFixture,
  cashRegisterSessionFixture,
  crudCreateResponse,
  customerFixture,
  type EstimateListItemFixture,
  type ExpenseWithCategoryFixture,
  estimateListItemFixture,
  expenseWithCategoryFixture,
  type FinanceOverviewFixture,
  financeOverviewFixture,
  type InventoryPartFixture,
  inventoryPartFixture,
  mechanicTimeStatusFixture,
  type OrgMemberFixture,
  organizationDetailFixture,
  orgMemberFixture,
  overviewDashboardFixture,
  type ReportDataFixture,
  reportDataFixture,
  SEED,
  type ServiceCatalogFixture,
  type ServiceScheduleFixture,
  serviceCatalogFixture,
  serviceScheduleFixture,
  type VehicleModelItem,
  vehicleModelFixture,
  type WorkOrderDetailFixture,
  type WorkOrderListItemFixture,
  workOrderDetailFixture,
  workOrderListItemFixture,
} from "../fixtures";

const ORG_ID = SEED.orgId;

// ─── Helpers ──────────────────────────────────────────────────────────────

function ok(body: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

// ─── Bay View ─────────────────────────────────────────────────────────────

/**
 * Mock GET /api/organizations/[id]/bay-view
 */
export async function mockBayView(
  page: Page,
  fixture?: Partial<BayViewResponse>,
) {
  const data = bayViewFixture(fixture);
  await page.route("**/api/organizations/*/bay-view", (route) => {
    return route.fulfill(ok(data));
  });
}

// ─── Work Order Detail ────────────────────────────────────────────────────

/**
 * Mock GET /api/organizations/[id]/work-orders/[workOrderId]/detail
 */
export async function mockWorkOrderDetail(
  page: Page,
  workOrderId: string,
  fixture?: Partial<WorkOrderDetailFixture>,
) {
  const data = workOrderDetailFixture({ id: workOrderId, ...fixture });
  await page.route(
    `**/api/organizations/*/work-orders/${workOrderId}/detail`,
    (route) => {
      return route.fulfill(ok(data));
    },
  );
}

/**
 * Mock POST /api/organizations/[id]/work-orders/[workOrderId] — update
 */
export async function mockUpdateWorkOrder(
  page: Page,
  workOrderId: string,
  response?: Record<string, unknown>,
) {
  await page.route(
    `**/api/organizations/*/work-orders/${workOrderId}`,
    (route) => {
      if (
        route.request().method() === "PATCH" ||
        route.request().method() === "PUT"
      ) {
        return route.fulfill(ok(response ?? { success: true }));
      }
      return route.continue();
    },
  );
}

// ─── Organization ─────────────────────────────────────────────────────────

/**
 * Mock the organization selector / list API
 */
export async function mockOrganizations(page: Page) {
  // Mock ONLY the org list endpoint (exact path). The old glob
  // "**/api/organizations/**" swallowed every org-scoped API GET
  // (customers, vehicles, ...) with an org-array response, breaking
  // those pages. Nested endpoints now hit their real/more-specific mocks.
  for (const pattern of ["**/api/organizations", "**/api/organizations?*"]) {
    await page.route(pattern, (route) => {
      if (route.request().method() !== "GET") return route.continue();
      return route.fulfill(
        ok([
          {
            id: ORG_ID,
            name: "TOLOM E2E Test",
            slug: "tolom-e2e-test",
          },
        ]),
      );
    });
  }
}

// ─── Auth / Profile ───────────────────────────────────────────────────────

/**
 * Mock the layout's usePrewarm() fetches — every dashboard page fires 6
 * org-scoped queries (branches, services, customers 200, vehicles 200,
 * inventory parts 200, service-reminders) on mount. Against the real backend
 * that's ~30 heavy requests per page serialized by the dev server (~10-15s),
 * which blew page-load timeouts under parallel runs. Empty data is fine for
 * specs that mock their own page data.
 */
export async function mockPrewarm(page: Page) {
  await page.route(`**/api/organizations/*/branches`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/services`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/customers*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/vehicles*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/inventory/parts*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/service-reminders`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
}

/**
 * Mock GET /api/profile
 */
export async function mockProfile(
  page: Page,
  overrides?: {
    organizationId?: string;
    roleName?: string;
    permissionNames?: string[];
  },
) {
  if (!overrides) {
    // Pass through to the real /api/profile. The old fixture response used
    // snake_case keys (organization_id), but the app now reads camelCase
    // (organizationId) from a unified profile shape — the fixture produced
    // organizationId=null, leaving every page stuck in its loading state.
    // With a real session the pass-through returns the real org, and all
    // org-scoped endpoints work against the live backend.
    await page.route("**/api/profile", (route) => route.continue());
    return;
  }
  // Override mode — specs that need a fixture org id (mocked org-scoped
  // endpoints) or a specific role. Must return the camelCase profile shape
  // the app reads (useProfile).
  await page.route("**/api/profile", (route) =>
    route.fulfill(
      ok({
        id: "e2e-user-id",
        email: "themuuln4@gmail.com",
        username: null,
        phone: null,
        fullName: "E2E User",
        avatarUrl: null,
        organizationId:
          overrides.organizationId ??
          "e2e-00000000-0000-0000-0000-000000000001",
        organizationName: "TOLOM E2E Test",
        branchId: null,
        roleId: "role-owner",
        roleName: overrides.roleName ?? "Org Owner",
        permissionNames: overrides.permissionNames ?? [
          "work_orders.read",
          "work_orders.create",
          "customers.read",
          "customers.create",
          "reports.read",
          "inventory.read",
          "invoices.read",
        ],
      }),
    ),
  );
}

// ─── Supabase REST bypass ─────────────────────────────────────────────────

/**
 * Mock ALL Supabase REST calls for the current org — use as a sledgehammer
 * when you want a test to never touch real Supabase. Returns empty data
 * for all .select() calls by default; override specific routes as needed.
 */
export async function mockSupabaseREST(page: Page) {
  await page.route("**/rest/v1/**", (route) => {
    return route.fulfill(ok([]));
  });
}

// ─── Work Orders ─────────────────────────────────────────────────────────

export async function mockWorkOrders(
  page: Page,
  items?: WorkOrderListItemFixture[],
  overrides?: { total?: number },
) {
  await page.route("**/api/organizations/*/work-orders", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const data = items ?? [
      workOrderListItemFixture(),
      workOrderListItemFixture({ id: "wo-2", status: "completed" }),
    ];
    await route.fulfill(ok({ data, total: overrides?.total ?? data.length }));
  });
}

// ─── Appointments ────────────────────────────────────────────────────────

export async function mockAppointments(
  page: Page,
  items?: AppointmentFixture[],
) {
  await page.route("**/api/organizations/*/appointments", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const data = items ?? [appointmentFixture()];
    await route.fulfill(ok({ data }));
  });
}

// ─── Expenses ────────────────────────────────────────────────────────────

export async function mockExpenses(
  page: Page,
  items?: ExpenseWithCategoryFixture[],
) {
  await page.route("**/api/organizations/*/expenses", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const data = items ?? [expenseWithCategoryFixture()];
    await route.fulfill(ok({ data }));
  });
}

export async function mockExpensesStats(page: Page) {
  await page.route("**/api/organizations/*/expenses?stats=*", async (route) => {
    await route.fulfill(
      ok({
        data: {
          total: 1500000,
          paid: 1200000,
          unpaid: 300000,
          count: 8,
        },
      }),
    );
  });
  // Also match the base expenses endpoint for stats
  await page.route("**/api/organizations/*/expenses*", async (route) => {
    const url = route.request().url();
    if (url.includes("stats") || url.includes("category"))
      return route.fallback();
    await route.fulfill(ok({ data: [expenseWithCategoryFixture()] }));
  });
}

export async function mockExpenseCategories(page: Page) {
  await page.route(
    "**/api/organizations/*/expense-categories",
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill(
        ok({
          data: [
            {
              id: SEED.expenses.category1,
              name: "Supplies",
              color: "#6366f1",
            },
            { id: "cat-2", name: "Rent", color: "#ef4444" },
            { id: "cat-3", name: "Utilities", color: "#22c55e" },
          ],
        }),
      );
    },
  );
}

// ─── Estimates ───────────────────────────────────────────────────────────

export async function mockEstimates(
  page: Page,
  items?: EstimateListItemFixture[],
) {
  await page.route("**/api/organizations/*/estimates", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const data = items ?? [estimateListItemFixture()];
    await route.fulfill(ok(data));
  });
}

// ─── Services (catalog) ──────────────────────────────────────────────────

export async function mockServices(
  page: Page,
  items?: ServiceCatalogFixture[],
) {
  await page.route("**/api/organizations/*/services", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const data = items ?? [serviceCatalogFixture()];
    await route.fulfill(ok(data));
  });
}

// ─── Service Reminders ───────────────────────────────────────────────────

export async function mockServiceReminders(
  page: Page,
  items?: ServiceScheduleFixture[],
) {
  await page.route(`**/organizations/*/service-reminders`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const data = items ?? [serviceScheduleFixture()];
    await route.fulfill(ok({ data }));
  });
}

// ─── Cash Register ───────────────────────────────────────────────────────

export async function mockCashRegister(
  page: Page,
  session?: CashRegisterSessionFixture | null,
) {
  await page.route("**/api/organizations/*/cash-register**", async (route) => {
    const url = route.request().url();
    if (url.includes("/sessions")) {
      await route.fulfill(
        ok({ data: session ? [session] : [], total: session ? 1 : 0 }),
      );
      return;
    }
    // undefined → default fixture; explicit null → NO session (Open Register)
    await route.fulfill(
      ok({
        data: session === undefined ? cashRegisterSessionFixture() : session,
      }),
    );
  });
}

// ─── Finance Overview ────────────────────────────────────────────────────

export async function mockFinanceOverview(
  page: Page,
  fixture?: FinanceOverviewFixture,
) {
  await page.route(`**/organizations/*/reports*`, async (route) => {
    // Don't swallow the dashboard's reports?type=dashboard — fall through
    // to the more specific dashboard mock (last-registered wins).
    const url = new URL(route.request().url());
    const type = url.searchParams.get("type");
    if (type === "dashboard") return route.fallback();
    // List-ish report endpoints (e.g. the top bar's mechanic selector
    // fetches reports?type=mechanics and calls .find() on the array) must
    // return an ARRAY, not the finance summary object.
    if (type) return route.fulfill(ok({ data: [] }));
    await route.fulfill(ok({ data: fixture ?? financeOverviewFixture() }));
  });
  await page.route(`**/organizations/*/invoices*`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill(ok({ data: [], total: 0 }));
  });
  await page.route(`**/organizations/*/refunds*`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill(ok({ data: [] }));
  });
}

// ─── Inventory Parts ─────────────────────────────────────────────────────

export async function mockInventoryParts(
  page: Page,
  items?: InventoryPartFixture[],
) {
  await page.route(`**/organizations/*/inventory/parts*`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const data = items ?? [inventoryPartFixture()];
    await route.fulfill(ok({ data, total: data.length }));
  });
}

export async function mockInventoryBalances(page: Page) {
  await page.route(`**/organizations/*/inventory/balances*`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill(ok({ data: [], total: 0 }));
  });
}

export async function mockInventoryMovements(page: Page) {
  await page.route(`**/organizations/*/inventory/movements*`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill(ok({ data: [], total: 0 }));
  });
}

export async function mockInventorySuppliers(page: Page) {
  await page.route(`**/organizations/*/inventory/suppliers*`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill(ok({ data: [], total: 0 }));
  });
}

export async function mockInventoryThresholds(page: Page) {
  await page.route(
    `**/organizations/*/inventory/thresholds*`,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill(ok({ data: [], total: 0 }));
    },
  );
}

export async function mockInventoryPurchaseOrders(page: Page) {
  await page.route(
    `**/organizations/*/inventory/purchase-orders*`,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill(ok({ data: [], total: 0 }));
    },
  );
}

export async function mockInventoryTransfers(page: Page) {
  await page.route(`**/organizations/*/inventory/transfers*`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill(ok({ data: [], total: 0 }));
  });
}

export async function mockInventoryPartsCars(page: Page) {
  await page.route(
    `**/organizations/*/inventory/parts-cars*`,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill(ok({ data: [], total: 0 }));
    },
  );
}

/**
 * Mock ALL inventory endpoints at once.
 */
export async function mockInventoryAll(page: Page) {
  await mockInventoryParts(page);
  await mockInventoryBalances(page);
  await mockInventoryMovements(page);
  await mockInventorySuppliers(page);
  await mockInventoryThresholds(page);
  await mockInventoryPurchaseOrders(page);
  await mockInventoryTransfers(page);
  await mockInventoryPartsCars(page);
}

// ─── Reports ─────────────────────────────────────────────────────────────

export async function mockReports(page: Page, fixture?: ReportDataFixture) {
  await page.route(`**/organizations/*/reports*`, async (route) => {
    const url = new URL(route.request().url());
    const type = url.searchParams.get("type");
    // Dashboard + mechanic endpoints are array-shaped.
    if (type === "dashboard") return route.fallback();
    if (type === "mechanics") return route.fulfill(ok({ data: [] }));
    // List-ish report endpoints the overview tab renders as arrays.
    if (type === "insights") return route.fulfill(ok({ data: [] }));
    if (type === "targets") return route.fulfill(ok({ data: [] }));
    if (type === "service-breakdown") return route.fulfill(ok({ data: [] }));
    if (type === "mechanic-leaderboard") return route.fulfill(ok({ data: [] }));
    // Forecast can be null (card renders the empty state).
    if (type === "forecast") return route.fulfill(ok({ data: null }));
    // Object-shaped analytics endpoints.
    if (type === "retention") {
      return route.fulfill(
        ok({
          data: {
            total_customers: 142,
            retention_rate: 62.5,
            returning_customers: 88,
            new_customers: 54,
            avg_visits_per_customer: 2.4,
            avg_lifetime_value: 350000,
            top_customers: [],
          },
        }),
      );
    }
    if (type === "pnl") {
      return route.fulfill(
        ok({
          data: {
            revenue: {
              service_revenue: 8300000,
              parts_revenue: 4200000,
              total: 12500000,
            },
            cogs: { total: 3100000 },
            expenses: { total: 1500000, by_category: [] },
            gross_profit: 5200000,
            gross_margin_pct: 41.6,
            net_profit: 3500000,
          },
        }),
      );
    }
    if (type === "finance-summary") {
      return route.fulfill(
        ok({
          data: {
            total_revenue: 5000000,
            total_expenses: 1500000,
            net_profit: 3500000,
            invoice_count: 12,
            pending_invoices: 3,
            paid_invoices: 9,
            period: "month",
          },
        }),
      );
    }
    if (url.pathname.includes("mechanic-hours")) {
      await route.fulfill(ok({ data: [] }));
      return;
    }
    if (url.pathname.includes("mechanic-commissions")) {
      await route.fulfill(ok({ data: [] }));
      return;
    }
    // The main report (no type / the reportType param) — full fixture.
    await route.fulfill(ok({ data: fixture ?? reportDataFixture() }));
  });
}

// ─── Mechanic Dashboard ──────────────────────────────────────────────────

export async function mockMechanicTimeStatus(page: Page) {
  await page.route(`**/organizations/*/me/time/status`, async (route) => {
    await route.fulfill(ok({ data: mechanicTimeStatusFixture() }));
  });
}

export async function mockMechanicsList(page: Page) {
  await page.route(`**/organizations/*/reports`, async (route) => {
    const url = route.request().url();
    if (url.includes("?")) {
      // Query params = list request
      await route.fulfill(
        ok({
          data: {
            mechanics: [
              { id: SEED.mechanics.bat.id, full_name: SEED.mechanics.bat.name },
              {
                id: SEED.mechanics.dorj.id,
                full_name: SEED.mechanics.dorj.name,
              },
            ],
          },
        }),
      );
    } else {
      await route.fulfill(ok({ data: reportDataFixture() }));
    }
  });
}

// ─── Settings ────────────────────────────────────────────────────────────

/**
 * Mock every endpoint the settings page fetches (it prefetches ~19 org-scoped
 * lists for its sections). Returning empty data makes the page render in
 * seconds instead of waiting on 30+ parallel prod queries — which under a
 * parallel E2E run blew the 60s test timeout. The org detail itself is
 * fulfilled with the fixture (the form needs a full org shape).
 */
export async function mockSettingsOrg(page: Page) {
  // Sub-endpoints first (they must win over the base detail route).
  await page.route(`**/api/organizations/*/branches`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/inventory/parts*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/inventory/suppliers*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/expense-categories`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/inventory/purchase-orders*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/work-orders*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/reports*`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/subscription*`, (r) =>
    r.fulfill(ok({ data: { plan_type: "pro", status: "active" } })),
  );
  await page.route(`**/api/organizations/*/features`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/services`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/customers*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/vehicles*`, (r) =>
    r.fulfill(ok({ data: [], total: 0 })),
  );
  await page.route(`**/api/organizations/*/service-reminders`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/commission-rules`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/price-rules`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/organizations/*/diagnosis-labels`, (r) =>
    r.fulfill(ok({ data: [] })),
  );
  await page.route(`**/api/car-brands`, (r) => r.fulfill(ok({ data: [] })));
  // The org detail itself — registered LAST (last-registered wins for the
  // exact path) and the form needs the full org shape.
  await page.route("**/api/organizations/*", (r) =>
    r.fulfill(ok({ data: organizationDetailFixture() })),
  );
}

// ─── Organization ────────────────────────────────────────────────────────

export async function mockOrganizationDetail(page: Page) {
  await page.route("**/api/organizations/*", async (route) => {
    const url = route.request().url();
    if (url.includes("/subscription")) {
      await route.fulfill(ok({ data: { plan_type: "pro", status: "active" } }));
      return;
    }
    if (url.includes("/members")) {
      await route.fulfill(ok({ data: [] }));
      return;
    }
    if (url.includes("/roles")) {
      await route.fulfill(ok({ data: [] }));
      return;
    }
    if (url.includes("/clock/devices")) {
      await route.fulfill(ok({ data: [] }));
      return;
    }
    await route.fulfill(ok({ data: organizationDetailFixture() }));
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────

export async function mockAdminMe(page: Page) {
  await page.route("**/api/admin/me", async (route) => {
    await route.fulfill(ok({ data: adminMeFixture() }));
  });
}

export async function mockAdminSellers(page: Page) {
  await page.route("**/api/admin/sellers", async (route) => {
    await route.fulfill(
      ok({
        data: {
          organizations: [],
          assignments: [],
        },
      }),
    );
  });
}

export async function mockAdminOrganizations(page: Page) {
  await page.route("**/api/admin/organizations", async (route) => {
    await route.fulfill(ok({ data: [] }));
  });
}

export async function mockAdminStats(page: Page) {
  await page.route("**/api/admin/stats", async (route) => {
    await route.fulfill(
      ok({
        data: { total_orgs: 5, total_users: 20, active_subscriptions: 4 },
      }),
    );
  });
}

/**
 * Mock ALL admin endpoints at once.
 */
export async function mockAdminAll(page: Page) {
  await mockAdminMe(page);
  await mockAdminSellers(page);
  await mockAdminOrganizations(page);
  await mockAdminStats(page);
}

// ─── CRUD Mutation Mocks ──────────────────────────────────────────────────

/**
 * Mock all CRUD mutation endpoints (POST/PUT/PATCH/DELETE) for a given resource.
 * Intercepts mutations on the org-scoped API and returns success.
 *
 * @param resource - e.g. "customers", "services", "appointments"
 * @param createResponse - response body for POST (create)
 * @param updateResponse - response body for PATCH/PUT (update)
 */
export async function mockCrudMutations(
  page: Page,
  resource: string,
  opts?: {
    createResponse?: Record<string, unknown>;
    updateResponse?: Record<string, unknown>;
  },
) {
  // POST (create) — matches /api/organizations/*/resource
  await page.route(`**/api/organizations/*/${resource}`, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill(
        ok({
          data: opts?.createResponse ?? crudCreateResponse(),
        }),
      );
    } else {
      await route.continue();
    }
  });

  // PATCH/PUT/DELETE — matches /api/organizations/*/resource/*
  await page.route(`**/api/organizations/*/${resource}/**`, async (route) => {
    const method = route.request().method();
    if (method === "PATCH" || method === "PUT") {
      await route.fulfill(
        ok({
          data: opts?.updateResponse ?? { success: true },
        }),
      );
    } else if (method === "DELETE") {
      await route.fulfill(ok({ data: null }));
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock customer list + CRUD mutations.
 */
export async function mockCustomers(page: Page, items?: CustomerFixture[]) {
  const list = items ?? [customerFixture()];
  await page.route("**/api/organizations/*/customers*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill(ok({ data: list, total: list.length }));
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock all customer CRUD operations (list + mutations).
 */
export async function mockCustomerCrud(page: Page, items?: CustomerFixture[]) {
  await mockCustomers(page, items);
  await mockCrudMutations(page, "customers");
}
// ─── Overview Dashboard ───────────────────────────────────────────────────

/**
 * Mock GET /api/organizations/[id]/dashboard (overview page)
 */
export async function mockOverviewDashboard(
  page: Page,
  fixture?: import("../fixtures").OverviewDashboardFixture,
) {
  const data = fixture ?? overviewDashboardFixture();
  // Dashboard data now lives under /reports?type=dashboard
  await page.route("**/api/organizations/*/reports?*", (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("type") !== "dashboard") return route.continue();
    // The dashboard query unwraps json.data — the fixture must be wrapped.
    return route.fulfill(ok({ data }));
  });
}

// ─── Vehicle Models ───────────────────────────────────────────────────────

/**
 * Mock GET /api/organizations/[id]/vehicle-models
 */
export async function mockVehicleModels(
  page: Page,
  items?: VehicleModelItem[],
) {
  const data = items ?? [
    vehicleModelFixture(),
    vehicleModelFixture({
      id: "e2e-00000000-0000-0000-0000-000000000101",
      make: "Toyota",
      model: "Prius",
      variant: null,
      body_type: "hatchback",
    }),
    vehicleModelFixture({
      id: "e2e-00000000-0000-0000-0000-000000000102",
      make: "Lexus",
      model: "RX350",
      variant: "SUV",
      year_from: 2019,
      year_to: 2023,
      body_type: "suv",
    }),
  ];
  await page.route("**/api/organizations/*/vehicle-models", (route) =>
    route.fulfill(ok({ data })),
  );
}

// ─── Organization Members ─────────────────────────────────────────────────

/**
 * Mock GET /api/organizations/[id]/members
 */
export async function mockOrgMembers(page: Page, items?: OrgMemberFixture[]) {
  const data = items ?? [
    orgMemberFixture(),
    orgMemberFixture({
      id: "e2e-00000000-0000-0000-0000-000000000201",
      role: "admin",
      full_name: "E2E Admin",
      email: "admin@e2e.test",
    }),
  ];
  await page.route("**/api/organizations/*/members", (route) =>
    route.fulfill(ok({ data })),
  );
}

// ─── Guide ─────────────────────────────────────────────────────────────────

/**
 * Mock GET /api/organizations/[id]/guide
 */
export async function mockGuide(page: Page) {
  await page.route("**/api/organizations/*/guide", (route) =>
    route.fulfill(ok({ sections: [] })),
  );
}
