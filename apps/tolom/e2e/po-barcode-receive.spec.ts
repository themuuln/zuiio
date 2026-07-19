import { setEnglishLocale } from "./helpers";
import { mockOrganizationDetail } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(30_000);

const PO_ID = "po-barcode-test-0001";
const PO_NUMBER = "PO-2024-001";
const PART_NAME = "Brake Pad Set";
const BARCODE = "1234567890123";

/** Mock GET /api/organizations/[id]/inventory/purchase-orders (paginated). */
async function mockPurchaseOrdersList(page: import("@playwright/test").Page) {
  await page.route(
    `**/organizations/*/inventory/purchase-orders*`,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            data: [
              {
                id: PO_ID,
                organization_id: "org-1",
                supplier_id: "sup-1",
                order_number: PO_NUMBER,
                status: "ordered",
                total_amount: 50000,
                supplier: { id: "sup-1", name: "AutoParts LLC" },
              },
            ],
            total: 1,
          },
        }),
      });
    },
  );
}

/** Mock GET /api/organizations/[id]/inventory/purchase-orders/[id]/items. */
async function mockPurchaseOrderItems(
  page: import("@playwright/test").Page,
  getReceived: () => number,
) {
  await page.route(
    `**/organizations/*/inventory/purchase-orders/${PO_ID}/items*`,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            data: [
              {
                id: "poi-1",
                part_id: "part-1",
                part_name: PART_NAME,
                quantity_ordered: 5,
                quantity_received: getReceived(),
                unit_cost: 10000,
                barcode: BARCODE,
              },
            ],
            total: 1,
          },
        }),
      });
    },
  );
}

/**
 * Mock POST .../purchase-orders/[id]/receive-barcode.
 * Resolves with the updated PO item (received incremented by 1). The mock is the
 * source of truth: it bumps `state.received` on each successful scan so the items
 * table (which re-fetches after the mutation invalidates) reflects the new count.
 */
function mockBarcodeReceive(
  page: import("@playwright/test").Page,
  state: { received: number },
) {
  return page.route(
    `**/organizations/*/inventory/purchase-orders/${PO_ID}/receive-barcode`,
    async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      state.received += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "poi-1",
            part_id: "part-1",
            quantity_ordered: 5,
            quantity_received: state.received,
            unit_cost: 10000,
          },
        }),
      });
    },
  );
}

test.describe("PO Barcode Receive (Mocked)", () => {
  const state = { received: 0 };

  test.beforeEach(async ({ page, context }) => {
    state.received = 0;
    await setEnglishLocale(page);
    // The saved auth session (e2e/.auth/user.json) only carries sb-access-token /
    // sb-refresh-token, which @supabase/ssr does NOT read — it expects the single
    // `sb-<ref>-auth-token` cookie. Without it, getSession() returns null in the
    // middleware and the app redirects to /auth/login before any page renders.
    // Reconstruct that cookie from the stored access token so the real session flows.
    const { addSupabaseSessionCookie } = await import("./auth-cookie");
    await addSupabaseSessionCookie(context);
    // Let the real Supabase session + /api/profile flow through. Mocking
    // **/rest/v1/** (mockSupabaseREST) breaks the client-side auth session,
    // which redirects to /auth/login before any page content renders.
    await mockOrganizationDetail(page);
    await mockPurchaseOrdersList(page);
    await mockPurchaseOrderItems(page, () => state.received);
    mockBarcodeReceive(page, state);
    await page.goto("/dashboard/inventory/purchase-orders");
  });

  test("opens PO drawer and shows scan-to-receive input", async ({ page }) => {
    // Open the PO detail drawer
    await page.getByText(PO_NUMBER).first().click();

    // Drawer shows the items table
    await expect(page.getByText(PART_NAME)).toBeVisible({ timeout: 10_000 });

    // Barcode scan section is visible
    await expect(page.getByText("Scan to Receive")).toBeVisible();
    const input = page.getByPlaceholder("Enter barcode...");
    await expect(input).toBeVisible();
  });

  test("scanning a barcode receives one item and increments received count", async ({
    page,
  }) => {
    await page.getByText(PO_NUMBER).first().click();
    await expect(page.getByText("Scan to Receive")).toBeVisible({
      timeout: 10_000,
    });

    const input = page.getByPlaceholder("Enter barcode...");
    await input.fill(BARCODE);

    // Capture the POST. The mock increments its own received counter on the
    // server side, so the items table (re-fetched after the mutation invalidates
    // the cache) reflects the new count without client-side state juggling.
    const [request] = await Promise.all([
      page.waitForRequest(
        `**/organizations/*/inventory/purchase-orders/${PO_ID}/receive-barcode`,
      ),
      page.getByRole("button", { name: "Receive Item" }).click(),
    ]);

    // Request carried the scanned barcode
    const body = request.postDataJSON() as { barcode?: string };
    expect(body.barcode).toBe(BARCODE);

    // Toast confirms
    await expect(page.getByText("Item received")).toBeVisible({
      timeout: 10_000,
    });

    // Items table re-fetches after invalidate; the received column cell
    // for our row now shows 1 (was 0 before the scan).
    const itemsTable = page.getByRole("table").last();
    await expect(
      itemsTable.getByRole("cell", { name: "1", exact: true }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows inline error when barcode is unknown", async ({ page }) => {
    await page.getByText(PO_NUMBER).first().click();
    await expect(page.getByText("Scan to Receive")).toBeVisible({
      timeout: 10_000,
    });

    const input = page.getByPlaceholder("Enter barcode...");
    await input.fill("000");

    // Override the mock to return an error for this scan
    await page.route(
      `**/organizations/*/inventory/purchase-orders/${PO_ID}/receive-barcode`,
      async (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        await route.fulfill({
          status: 400,
          contentType: "application/json",
            body: JSON.stringify({
              error: { message: "No part found with barcode: 000" },
            }),
        });
      },
    );

    await page.getByRole("button", { name: "Receive Item" }).click();

    // Inline error message appears
    await expect(
      page.getByText(/No part found with barcode/),
    ).toBeVisible({ timeout: 10_000 });
  });
});
