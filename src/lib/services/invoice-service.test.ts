import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/services/email-service", () => ({
  sendInvoiceEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Track table calls and return appropriate responses
let tableResponses: Record<string, any> = {};

function createMockDb() {
  const calls: { table: string; method: string }[] = [];

  const createChain = (table: string) => {
    const chain: Record<string, any> = {};

    const addMethod = (name: string, fn?: Function) => {
      chain[name] = fn
        ? vi.fn().mockImplementation(fn)
        : vi.fn().mockReturnValue(chain);
    };

    // Add chainable methods
    ["select", "insert", "update", "delete", "upsert",
     "eq", "neq", "gt", "gte", "lt", "lte", "is", "in",
     "contains", "or", "and", "not", "order", "limit", "range",
    ].forEach(m => addMethod(m));

    // Add terminal methods
    addMethod("single", () => {
      calls.push({ table, method: "single" });
      const response = tableResponses[table]?.single ?? { data: null, error: null };
      return Promise.resolve(response);
    });

    addMethod("maybeSingle", () => {
      calls.push({ table, method: "maybeSingle" });
      const response = tableResponses[table]?.maybeSingle ?? { data: null, error: null };
      return Promise.resolve(response);
    });

    // Make thenable
    chain.then = (resolve: Function) => {
      const response = tableResponses[table]?.then ?? { data: null, error: null };
      return Promise.resolve(response).then(resolve);
    };

    return chain;
  };

  const db = {
    from: vi.fn().mockImplementation((table: string) => {
      calls.push({ table, method: "from" });
      return createChain(table);
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    __calls: calls,
    __setResponse: (table: string, method: string, response: any) => {
      if (!tableResponses[table]) tableResponses[table] = {};
      tableResponses[table][method] = response;
    },
    __reset: () => {
      tableResponses = {};
      calls.length = 0;
    },
  };

  return db as unknown as SupabaseClient & { __calls: any[]; __setResponse: Function; __reset: Function };
}

beforeEach(() => {
  tableResponses = {};
});

// ── Tests ─────────────────────────────────────────────────────

describe("Invoice Service - Tax Transfer", () => {
  describe("createInvoiceFromWorkOrder", () => {
    it("transfers НӨАТ from work order to invoice when enabled", async () => {
      const db = createMockDb();
      const { createInvoiceFromWorkOrder } = await import("./invoice-service");

      // Setup responses for each table query
      db.__setResponse("work_orders", "single", {
        data: {
          id: "wo-1",
          organization_id: "org-1",
          status: "Completed",
          customer_id: "cust-1",
          vehicle_id: "veh-1",
          discount_amount: 0,
          nuat_enabled: true,
        },
        error: null,
      });

      db.__setResponse("invoices", "maybeSingle", {
        data: null, // No existing invoice
        error: null,
      });

      db.__setResponse("customers", "single", {
        data: {
          id: "cust-1",
          first_name: "Bat",
          last_name: "Erdene",
          phone: "99112233",
        },
        error: null,
      });

      db.__setResponse("vehicles", "single", {
        data: {
          id: "veh-1",
          make: "Toyota",
          model: "Camry",
          year: 2020,
          plate_number: "1234АБ",
        },
        error: null,
      });

      db.__setResponse("work_order_services", "then", {
        data: [
          { id: "svc-1", service_name: "Oil Change", quantity: 1, unit_price: 50000, discount_amount: 0, final_price: 50000 },
        ],
        error: null,
      });

      db.__setResponse("work_order_parts", "then", {
        data: [
          { id: "part-1", part_name: "Oil Filter", quantity: 1, unit_price: 15000, discount_amount: 0, final_price: 15000 },
        ],
        error: null,
      });

      db.__setResponse("organization_settings", "single", {
        data: {
          nuat_enabled: true,
          default_tax_rate: 10,
          invoice_prefix: "INV",
        },
        error: null,
      });

      db.__setResponse("invoices", "single", {
        data: { id: "inv-1" },
        error: null,
      });

      const result = await createInvoiceFromWorkOrder("org-1", "wo-1", {
        supabase: db,
      });

      // Subtotal: 50000 + 15000 = 65000
      // Tax: 65000 * 10% = 6500
      // Total: 65000 + 6500 = 71500
      expect(result.tax_total).toBe(6500);
      expect(result.total).toBe(71500);
    });

    it("does not apply НӨАТ when work order has it disabled", async () => {
      const db = createMockDb();
      const { createInvoiceFromWorkOrder } = await import("./invoice-service");

      db.__setResponse("work_orders", "single", {
        data: {
          id: "wo-2",
          organization_id: "org-1",
          status: "Completed",
          customer_id: "cust-1",
          vehicle_id: "veh-1",
          discount_amount: 0,
          nuat_enabled: false,
        },
        error: null,
      });

      db.__setResponse("invoices", "maybeSingle", {
        data: null,
        error: null,
      });

      db.__setResponse("customers", "single", {
        data: { id: "cust-1", first_name: "Bat" },
        error: null,
      });

      db.__setResponse("vehicles", "single", {
        data: { id: "veh-1", plate_number: "1234АБ" },
        error: null,
      });

      db.__setResponse("work_order_services", "then", {
        data: [
          { id: "svc-1", service_name: "Oil Change", quantity: 1, unit_price: 50000, discount_amount: 0, final_price: 50000 },
        ],
        error: null,
      });

      db.__setResponse("work_order_parts", "then", {
        data: [],
        error: null,
      });

      db.__setResponse("organization_settings", "single", {
        data: {
          nuat_enabled: true,
          default_tax_rate: 10,
          invoice_prefix: "INV",
        },
        error: null,
      });

      db.__setResponse("invoices", "single", {
        data: { id: "inv-2" },
        error: null,
      });

      const result = await createInvoiceFromWorkOrder("org-1", "wo-2", {
        supabase: db,
      });

      // Subtotal: 50000
      // Tax: 0 (НӨАТ disabled)
      // Total: 50000
      expect(result.tax_total).toBe(0);
      expect(result.total).toBe(50000);
    });

    it("applies discount before calculating НӨАТ", async () => {
      const db = createMockDb();
      const { createInvoiceFromWorkOrder } = await import("./invoice-service");

      db.__setResponse("work_orders", "single", {
        data: {
          id: "wo-3",
          organization_id: "org-1",
          status: "Completed",
          customer_id: "cust-1",
          vehicle_id: "veh-1",
          discount_amount: 10000,
          nuat_enabled: true,
        },
        error: null,
      });

      db.__setResponse("invoices", "maybeSingle", {
        data: null,
        error: null,
      });

      db.__setResponse("customers", "single", {
        data: { id: "cust-1", first_name: "Bat" },
        error: null,
      });

      db.__setResponse("vehicles", "single", {
        data: { id: "veh-1", plate_number: "1234АБ" },
        error: null,
      });

      db.__setResponse("work_order_services", "then", {
        data: [
          { id: "svc-1", service_name: "Oil Change", quantity: 1, unit_price: 50000, discount_amount: 0, final_price: 50000 },
        ],
        error: null,
      });

      db.__setResponse("work_order_parts", "then", {
        data: [
          { id: "part-1", part_name: "Oil Filter", quantity: 1, unit_price: 15000, discount_amount: 0, final_price: 15000 },
        ],
        error: null,
      });

      db.__setResponse("organization_settings", "single", {
        data: {
          nuat_enabled: true,
          default_tax_rate: 10,
          invoice_prefix: "INV",
        },
        error: null,
      });

      db.__setResponse("invoices", "single", {
        data: { id: "inv-3" },
        error: null,
      });

      const result = await createInvoiceFromWorkOrder("org-1", "wo-3", {
        supabase: db,
      });

      // Subtotal: 65000
      // Discount: 10000
      // Taxable: 55000
      // Tax: 55000 * 10% = 5500
      // Total: 55000 + 5500 = 60500
      expect(result.discount_total).toBe(10000);
      expect(result.tax_total).toBe(5500);
      expect(result.total).toBe(60500);
    });
  });
});
