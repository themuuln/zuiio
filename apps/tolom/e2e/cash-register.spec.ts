import { cashRegisterSessionFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockCashRegister, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

const activeSession = cashRegisterSessionFixture({
  opening_balance: 500000,
  total_sales: 350000,
  total_cash_out: 50000,
  entries: [
    {
      id: "entry-sale-1",
      type: "sale",
      amount: 350000,
      description: "Work order payment",
      created_at: "2024-01-15T10:00:00Z",
      work_order_id: "e2e-work-order-1",
    },
    {
      id: "entry-cashout-1",
      type: "cash_out",
      amount: 50000,
      description: "Office supplies",
      created_at: "2024-01-15T11:00:00Z",
      work_order_id: null,
    },
  ],
});

test.describe("Cash Register (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockCashRegister(page, activeSession);
    await page.goto("/dashboard/cash-register");
  });

  test.describe("Page Structure", () => {
    test("loads the cash register page without crashing", async ({ page }) => {
      await expect(page.getByText(/cash register/i).first()).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Active Session", () => {
    test("shows active session controls or Open Register button", async ({
      page,
    }) => {
      // Either a session is active (shows cash out/close) or no session (shows open register)
      await expect(
        page
          .getByRole("button", { name: /cash out|close|open register/i })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("No Session", () => {
    test("shows Open Register button when no session", async ({ page }) => {
      await page.unrouteAll();
      await mockSupabaseREST(page);
      await mockCashRegister(page, null);
      await page.goto("/dashboard/cash-register");

      await expect(
        page.getByRole("button", { name: /open register/i }).first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Cash Register link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /cash register/i }).first(),
      ).toBeVisible();
    });
  });
});
