# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> Shop — product detail >> shows h1, price, and description
- Location: e2e/shop.spec.ts:88:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('h1')
Expected: "Onoo подуу цамц"
Received: "Onoo T-Shirt"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for locator('h1')
    14 × locator resolved to <h1 class="text-3xl font-bold">Onoo T-Shirt</h1>
       - unexpected value "Onoo T-Shirt"

```

```yaml
- heading "Onoo T-Shirt" [level=1]
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | const SHOP = "/shop";
  4   | const PRODUCT_URL = "/shop/onoo-t-shirt";
  5   | const ADMIN_PRODUCTS = "/admin/products";
  6   | const ADMIN_ORDERS = "/admin/orders";
  7   | const LOGIN_URL = "/auth/login";
  8   | 
  9   | const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54325";
  10  | const ANON_KEY =
  11  |   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  12  |   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
  13  | const SERVICE_KEY =
  14  |   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
  15  | 
  16  | // ─── Helper: create admin user + sign in via browser ─────────────────
  17  | 
  18  | async function signInAsAdmin(page: Page) {
  19  |   const email = `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@pwtest.mn`;
  20  |   const password = "PwTestPass123!";
  21  | 
  22  |   // Sign up via Supabase REST API
  23  |   const resp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
  24  |     method: "POST",
  25  |     headers: { "Content-Type": "application/json", apikey: ANON_KEY },
  26  |     body: JSON.stringify({ email, password }),
  27  |   });
  28  |   const data = await resp.json();
  29  |   const userId = data.user?.id ?? data.id;
  30  |   if (!userId) throw new Error(`Signup failed: ${JSON.stringify(data)}`);
  31  | 
  32  |   // Grant admin membership via service role
  33  |   const mResp = await fetch(`${SUPABASE_URL}/rest/v1/memberships`, {
  34  |     method: "POST",
  35  |     headers: {
  36  |       "Content-Type": "application/json",
  37  |       apikey: SERVICE_KEY,
  38  |       Authorization: `Bearer ${SERVICE_KEY}`,
  39  |     },
  40  |     body: JSON.stringify({
  41  |       user_id: userId,
  42  |       scope_type: "league",
  43  |       scope_id: "c0000000-0000-0000-0000-000000000001",
  44  |       role: "admin",
  45  |     }),
  46  |   });
  47  |   if (!mResp.ok) throw new Error(`Membership failed: ${await mResp.text()}`);
  48  | 
  49  |   // Sign in via browser
  50  |   await page.goto(LOGIN_URL);
  51  |   await page.waitForLoadState("networkidle");
  52  |   await page.getByPlaceholder("Имэйл").fill(email);
  53  |   await page.getByPlaceholder("Нууц үг").fill(password);
  54  |   await page.getByRole("button", { name: "Нэвтрэх" }).click();
  55  |   await page.waitForURL(/\/(admin|auth)/, { timeout: 15000 });
  56  | }
  57  | 
  58  | // ═══════════════════════════════════════════════════════════════════════
  59  | // Public catalogue
  60  | // ═══════════════════════════════════════════════════════════════════════
  61  | 
  62  | test.describe("Shop — public catalogue", () => {
  63  |   test("loads with shop title", async ({ page }) => {
  64  |     await page.goto(SHOP);
  65  |     await expect(page.locator("h1")).toHaveText("Onoo дэлгүүр");
  66  |   });
  67  | 
  68  |   test("shows product cards with prices", async ({ page }) => {
  69  |     await page.goto(SHOP);
  70  |     await expect(page.getByText("₮35,000")).toBeVisible();
  71  |     await expect(page.getByText("₮75,000")).toBeVisible();
  72  |     await expect(page.getByText("₮25,000")).toBeVisible();
  73  |     await expect(page.getByText("₮10,000")).toBeVisible();
  74  |   });
  75  | 
  76  |   test("card click navigates to detail", async ({ page }) => {
  77  |     await page.goto(SHOP);
  78  |     await page.getByText("Onoo подуу цамц").first().click();
  79  |     await expect(page).toHaveURL(PRODUCT_URL);
  80  |   });
  81  | });
  82  | 
  83  | // ═══════════════════════════════════════════════════════════════════════
  84  | // Product detail
  85  | // ═══════════════════════════════════════════════════════════════════════
  86  | 
  87  | test.describe("Shop — product detail", () => {
  88  |   test("shows h1, price, and description", async ({ page }) => {
  89  |     await page.goto(PRODUCT_URL);
> 90  |     await expect(page.locator("h1")).toHaveText("Onoo подуу цамц");
      |                                      ^ Error: expect(locator).toHaveText(expected) failed
  91  |     await expect(page.getByText("₮35,000")).toBeVisible();
  92  |   });
  93  | 
  94  |   test("shows variant selector", async ({ page }) => {
  95  |     await page.goto(PRODUCT_URL);
  96  |     await expect(page.getByText("Хэмжээ")).toBeVisible();
  97  |   });
  98  | 
  99  |   test("shows buy button when in stock", async ({ page }) => {
  100 |     await page.goto(PRODUCT_URL);
  101 |     await expect(page.getByText("Худалдаж авах")).toBeVisible();
  102 |   });
  103 | 
  104 |   test("back link returns to catalogue", async ({ page }) => {
  105 |     await page.goto(PRODUCT_URL);
  106 |     await page.getByText("Дэлгүүр лүү буцах").click();
  107 |     await expect(page).toHaveURL(SHOP);
  108 |   });
  109 | });
  110 | 
  111 | // ═══════════════════════════════════════════════════════════════════════
  112 | // Checkout flow (mocks /api/shop/orders)
  113 | // ═══════════════════════════════════════════════════════════════════════
  114 | 
  115 | test.describe("Shop — checkout flow", () => {
  116 |   test.beforeEach(async ({ page }) => {
  117 |     await page.goto(PRODUCT_URL);
  118 |   });
  119 | 
  120 |   test("opens order dialog", async ({ page }) => {
  121 |     await page.route("**/api/shop/orders", async (route) => {
  122 |       if (route.request().method() === "POST")
  123 |         await route.fulfill({ status: 200, json: { orderId: "o1", totalMnt: 35000, qrImage: "data:qr", qrText: "qpay://t", merchantInvoiceId: "M1", expiresIn: 300 } });
  124 |     });
  125 |     await page.getByText("Худалдаж авах").click();
  126 |     await expect(page.getByText("Захиалга баталгаажуулах")).toBeVisible();
  127 |   });
  128 | 
  129 |   test("shows validation errors on empty submit", async ({ page }) => {
  130 |     await page.route("**/api/shop/orders", async (route) => {
  131 |       if (route.request().method() === "POST")
  132 |         await route.fulfill({ status: 200, json: {} });
  133 |     });
  134 |     await page.getByText("Худалдаж авах").click();
  135 |     await page.getByText("QPay-гаар төлөх").click();
  136 |     await expect(page.getByText("Нэрээ оруулна уу")).toBeVisible();
  137 |   });
  138 | 
  139 |   test("submits and shows QR", async ({ page }) => {
  140 |     let postedBody: unknown = null;
  141 |     await page.route("**/api/shop/orders", async (route) => {
  142 |       if (route.request().method() === "POST") {
  143 |         postedBody = route.request().postDataJSON();
  144 |         await route.fulfill({ status: 200, json: { orderId: "o2", totalMnt: 35000, qrImage: "data:qr", qrText: "qpay://o2", merchantInvoiceId: "M2", expiresIn: 300 } });
  145 |       }
  146 |     });
  147 |     await page.getByText("Худалдаж авах").click();
  148 |     await page.getByPlaceholder("Таны нэр").fill("Болд");
  149 |     await page.getByPlaceholder("9999-0000").fill("99112233");
  150 |     await page.getByText("QPay-гаар төлөх").click();
  151 |     await expect(page.locator('img[alt="QPay QR код"]')).toBeVisible();
  152 |     expect(postedBody).toHaveProperty("customerName", "Болд");
  153 |   });
  154 | 
  155 |   test("shows error toast on API failure", async ({ page }) => {
  156 |     await page.route("**/api/shop/orders", async (route) => {
  157 |       if (route.request().method() === "POST")
  158 |         await route.fulfill({ status: 400, json: { error: "Бараа дууссан байна" } });
  159 |     });
  160 |     await page.getByText("Худалдаж авах").click();
  161 |     await page.getByPlaceholder("Таны нэр").fill("Бат");
  162 |     await page.getByPlaceholder("9999-0000").fill("88887777");
  163 |     await page.getByText("QPay-гаар төлөх").click();
  164 |     await expect(page.getByText("Бараа дууссан байна")).toBeVisible();
  165 |   });
  166 | });
  167 | 
  168 | // ═══════════════════════════════════════════════════════════════════════
  169 | // Admin pages
  170 | // ═══════════════════════════════════════════════════════════════════════
  171 | 
  172 | test.describe("Admin — shop", () => {
  173 |   test("redirects unauthenticated to login", async ({ page }) => {
  174 |     await page.goto(ADMIN_PRODUCTS);
  175 |     await expect(page).toHaveURL(/admin\/login/);
  176 |   });
  177 | 
  178 |   test("shows products page", async ({ page }) => {
  179 |     await signInAsAdmin(page);
  180 |     await page.goto(ADMIN_PRODUCTS);
  181 |     await page.waitForLoadState("networkidle");
  182 |     await expect(page.getByText("Бүтээгдэхүүн")).toBeVisible({ timeout: 10000 });
  183 |   });
  184 | 
  185 |   test("shows orders page", async ({ page }) => {
  186 |     await signInAsAdmin(page);
  187 |     await page.goto(ADMIN_ORDERS);
  188 |     await page.waitForLoadState("networkidle");
  189 |     await expect(page.getByText("Захиалга")).toBeVisible({ timeout: 10000 });
  190 |   });
```