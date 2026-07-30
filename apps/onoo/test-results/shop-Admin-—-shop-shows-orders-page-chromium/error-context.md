# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> Admin — shop >> shows orders page
- Location: e2e/shop.spec.ts:251:7

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for getByPlaceholder('Имэйл')

```

# Test source

```ts
  1   | import { expect, type Page, test } from "@playwright/test";
  2   | 
  3   | const SHOP = "/shop";
  4   | const PRODUCT_URL = "/shop/onoo-t-shirt";
  5   | const ADMIN_PRODUCTS = "/admin/products";
  6   | const ADMIN_ORDERS = "/admin/orders";
  7   | const ADMIN_REVIEWS = "/admin/reviews";
  8   | const ADMIN_BUNDLES = "/admin/bundles";
  9   | const LOGIN_URL = "/auth/login";
  10  | 
  11  | const SUPABASE_URL =
  12  |   process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54325";
  13  | const ANON_KEY =
  14  |   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  15  |   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
  16  | const SERVICE_KEY =
  17  |   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
  18  | 
  19  | // ─── Helper: create admin user + sign in via browser ─────────────────
  20  | 
  21  | async function signInAsAdmin(page: Page) {
  22  |   const email = `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@pwtest.mn`;
  23  |   const password = "PwTestPass123!";
  24  | 
  25  |   // Sign up via Supabase REST API
  26  |   const resp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
  27  |     method: "POST",
  28  |     headers: { "Content-Type": "application/json", apikey: ANON_KEY },
  29  |     body: JSON.stringify({ email, password }),
  30  |   });
  31  |   const data = await resp.json();
  32  |   const userId = data.user?.id ?? data.id;
  33  |   if (!userId) throw new Error(`Signup failed: ${JSON.stringify(data)}`);
  34  | 
  35  |   // Grant admin membership via service role
  36  |   const mResp = await fetch(`${SUPABASE_URL}/rest/v1/memberships`, {
  37  |     method: "POST",
  38  |     headers: {
  39  |       "Content-Type": "application/json",
  40  |       apikey: SERVICE_KEY,
  41  |       Authorization: `Bearer ${SERVICE_KEY}`,
  42  |     },
  43  |     body: JSON.stringify({
  44  |       user_id: userId,
  45  |       scope_type: "league",
  46  |       scope_id: "c0000000-0000-0000-0000-000000000001",
  47  |       role: "admin",
  48  |     }),
  49  |   });
  50  |   if (!mResp.ok) throw new Error(`Membership failed: ${await mResp.text()}`);
  51  | 
  52  |   // Sign in via browser
  53  |   await page.goto(LOGIN_URL);
  54  |   await page.waitForLoadState("networkidle");
> 55  |   await page.getByPlaceholder("Имэйл").fill(email);
      |                                        ^ Error: locator.fill: Target page, context or browser has been closed
  56  |   await page.getByPlaceholder("Нууц үг").fill(password);
  57  |   await page.getByRole("button", { name: "Нэвтрэх" }).click();
  58  |   await page.waitForURL(/\/(admin|auth)/, { timeout: 15000 });
  59  | }
  60  | 
  61  | // ═══════════════════════════════════════════════════════════════════════
  62  | // Public catalogue
  63  | // ═══════════════════════════════════════════════════════════════════════
  64  | 
  65  | test.describe("Shop — public catalogue", () => {
  66  |   test("loads with shop title", async ({ page }) => {
  67  |     await page.goto(SHOP);
  68  |     await expect(page.locator("h1")).toHaveText("Onoo дэлгүүр");
  69  |   });
  70  | 
  71  |   test("shows product cards with prices", async ({ page }) => {
  72  |     await page.goto(SHOP);
  73  |     await expect(page.getByText("₮35,000")).toBeVisible();
  74  |     await expect(page.getByText("₮75,000")).toBeVisible();
  75  |     await expect(page.getByText("₮25,000")).toBeVisible();
  76  |     await expect(page.getByText("₮65,000").first()).toBeVisible();
  77  |   });
  78  | 
  79  |   test("card click navigates to detail", async ({ page }) => {
  80  |     await page.goto(SHOP);
  81  |     await page.getByText("Onoo T-Shirt").first().click();
  82  |     await expect(page).toHaveURL(PRODUCT_URL);
  83  |   });
  84  | });
  85  | 
  86  | // ═══════════════════════════════════════════════════════════════════════
  87  | // Product detail
  88  | // ═══════════════════════════════════════════════════════════════════════
  89  | 
  90  | test.describe("Shop — product detail", () => {
  91  |   test("shows h1, price, and description", async ({ page }) => {
  92  |     await page.goto(PRODUCT_URL);
  93  |     await expect(page.locator("h1")).toHaveText("Onoo T-Shirt");
  94  |     await expect(page.getByText("₮35,000").first()).toBeVisible();
  95  |   });
  96  | 
  97  |   test("shows variant selector", async ({ page }) => {
  98  |     await page.goto(PRODUCT_URL);
  99  |     await expect(page.getByText("Хэмжээ").first()).toBeVisible();
  100 |   });
  101 | 
  102 |   test("shows out of stock message when product unavailable", async ({ page }) => {
  103 |     await page.goto(PRODUCT_URL);
  104 |     await expect(page.getByText("Энэ бүтээгдэхүүн дууссан")).toBeVisible();
  105 |   });
  106 | 
  107 |   test("back link returns to catalogue", async ({ page }) => {
  108 |     await page.goto(PRODUCT_URL);
  109 |     await page.getByRole("link", { name: "Дэлгүүр лүү буцах" }).click();
  110 |     await expect(page).toHaveURL(SHOP);
  111 |   });
  112 | });
  113 | 
  114 | // ═══════════════════════════════════════════════════════════════════════
  115 | // Checkout flow (mocks /api/shop/orders)
  116 | // ═══════════════════════════════════════════════════════════════════════
  117 | 
  118 | test.describe.skip("Shop — checkout flow", () => {
  119 |   /**
  120 |    * Mock the Supabase products endpoint to inject an in-stock product.
  121 |    * Production data has all products out of stock, so we override
  122 |    * the API response to test the purchase flow.
  123 |    */
  124 |   async function mockProductInStock(page: Page) {
  125 |     await page.route("**/rest/v1/v_public_shop_products*", async (route) => {
  126 |       const url = new URL(route.request().url());
  127 |       const slug = url.searchParams.get("slug") ?? "onoo-t-shirt";
  128 |       await route.fulfill({
  129 |         status: 200,
  130 |         contentType: "application/json",
  131 |         body: JSON.stringify([{
  132 |           id: "00000000-0000-0000-0000-000000000001",
  133 |           name: "Onoo T-Shirt",
  134 |           slug,
  135 |           price_mnt: 35000,
  136 |           images: [],
  137 |           variants: [{ size: "M", stock: 10 }, { size: "L", stock: 5 }],
  138 |           is_available: true,
  139 |           created_at: "2026-01-01T00:00:00Z",
  140 |           updated_at: "2026-01-01T00:00:00Z",
  141 |           name_en: "Onoo T-Shirt",
  142 |           description: "Premium cotton tee with Onoo logo.",
  143 |           category: "clothing",
  144 |         }]),
  145 |       });
  146 |     });
  147 |   }
  148 | 
  149 |   test("opens order dialog", async ({ page }) => {
  150 |     await mockProductInStock(page);
  151 |     await page.goto(PRODUCT_URL);
  152 |     await page.waitForLoadState("networkidle");
  153 |     await page.route("**/api/shop/orders", async (route) => {
  154 |       if (route.request().method() === "POST")
  155 |         await route.fulfill({
```