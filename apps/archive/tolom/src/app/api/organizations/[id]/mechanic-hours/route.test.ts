import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn(
    (
      handler: (ctx: {
        request: NextRequest;
        orgId: string;
      }) => Promise<unknown>,
    ) => handler,
  ),
}));

const { GET } = await import("./route");

const ORG_ID = "org-test-1";

function makeRequest(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return new NextRequest(
    `http://localhost:3000/api/organizations/${ORG_ID}/mechanic-hours?${params}`,
  );
}

/**
 * Mocks from() to return different proxies per table, each with its own
 * thenResolveData so multiple table queries resolve independently.
 */
function setupTableMocks(
  client: ReturnType<typeof createMockSupabaseClient>,
  tableData: Array<{ table: string; data: unknown; error: unknown }>,
) {
  const tableMap = new Map(tableData.map((t) => [t.table, t]));

  client.from.mockImplementation((table: string) => {
    const entry = tableMap.get(table);
    const thenResolveData = entry
      ? { data: entry.data, error: entry.error }
      : { data: null, error: null };

    const qb: Record<string, ReturnType<typeof vi.fn>> & {
      then: Function;
    } = {} as any;

    const terminalMethods = ["single", "maybeSingle"];
    const chainableMethods = [
      "select",
      "insert",
      "update",
      "delete",
      "upsert",
      "eq",
      "neq",
      "gt",
      "gte",
      "lt",
      "lte",
      "is",
      "in",
      "contains",
      "or",
      "and",
      "not",
      "order",
      "limit",
      "range",
      "throwOnError",
      "setHeader",
    ];

    for (const method of terminalMethods) {
      qb[method] = vi.fn().mockReturnValue(qb);
    }
    for (const method of chainableMethods) {
      qb[method] = vi.fn().mockReturnValue(qb);
    }
    qb.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    qb.then = (
      onFulfilled?: (value: any) => any,
      onRejected?: (reason: any) => any,
    ) => Promise.resolve(thenResolveData).then(onFulfilled, onRejected);

    return qb;
  });

  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  );
}

describe("GET /api/organizations/[id]/mechanic-hours", () => {
  let client: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createMockSupabaseClient();
  });

  it("returns aggregated hours per mechanic with profile names", async () => {
    setupTableMocks(client, [
      {
        table: "mechanic_daily_reports",
        data: [
          { mechanic_id: "m-1", hours_worked: 8, report_date: "2025-06-01" },
          { mechanic_id: "m-1", hours_worked: 6, report_date: "2025-06-02" },
          { mechanic_id: "m-2", hours_worked: 10, report_date: "2025-06-01" },
        ],
        error: null,
      },
      {
        table: "profiles",
        data: [
          { id: "m-1", full_name: "Bat Erdene" },
          { id: "m-2", full_name: "Saraa" },
        ],
        error: null,
      },
    ]);

    const response = (await (GET as any)({
      request: makeRequest("2025-06-01", "2025-06-07"),
      orgId: ORG_ID,
    })) as Response;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([
      { mechanic_id: "m-1", mechanic_name: "Bat Erdene", total_hours: 14 },
      { mechanic_id: "m-2", mechanic_name: "Saraa", total_hours: 10 },
    ]);
  });

  it("returns empty array when no daily reports exist", async () => {
    setupTableMocks(client, [
      { table: "mechanic_daily_reports", data: [], error: null },
    ]);

    const response = (await (GET as any)({
      request: makeRequest("2025-06-01", "2025-06-07"),
      orgId: ORG_ID,
    })) as Response;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("works without date parameters", async () => {
    setupTableMocks(client, [
      {
        table: "mechanic_daily_reports",
        data: [
          { mechanic_id: "m-1", hours_worked: 8, report_date: "2025-06-01" },
        ],
        error: null,
      },
      {
        table: "profiles",
        data: [{ id: "m-1", full_name: "Bat Erdene" }],
        error: null,
      },
    ]);

    const response = (await (GET as any)({
      request: makeRequest(),
      orgId: ORG_ID,
    })) as Response;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([
      { mechanic_id: "m-1", mechanic_name: "Bat Erdene", total_hours: 8 },
    ]);
  });
});
