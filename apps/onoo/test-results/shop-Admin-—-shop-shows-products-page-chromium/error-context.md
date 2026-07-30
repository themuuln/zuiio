# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> Admin — shop >> shows products page
- Location: e2e/shop.spec.ts:242:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Имэйл')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - navigation "Үндсэн цэс" [ref=e5]:
        - link "Оноо" [ref=e6] [cursor=pointer]:
          - /url: /
          - img [ref=e8]
          - generic [ref=e11]: Оноо
        - list [ref=e12]:
          - listitem [ref=e13]:
            - link "Нүүр хуудас" [ref=e14] [cursor=pointer]:
              - /url: /
          - listitem [ref=e15]:
            - link "Тоглолтууд" [ref=e16] [cursor=pointer]:
              - /url: /games
          - listitem [ref=e17]:
            - link "Тоглогчид" [ref=e18] [cursor=pointer]:
              - /url: /players
          - listitem [ref=e19]:
            - link "Шалгуур" [ref=e20] [cursor=pointer]:
              - /url: /standings
          - listitem [ref=e21]:
            - link "Тэргүүлэгчид" [ref=e22] [cursor=pointer]:
              - /url: /leaders
          - listitem [ref=e23]:
            - button "Хайх (⌘K)" [ref=e24]:
              - img
              - generic:
                - generic "Command": ⌘
        - generic [ref=e25]:
          - link "Академи" [ref=e26] [cursor=pointer]:
            - /url: /academy
          - link "Дэлгүүр" [ref=e27] [cursor=pointer]:
            - /url: /shop
            - img
            - text: Дэлгүүр
    - region "Тоглолтын мэдээ" [ref=e29]:
      - generic [ref=e30]:
        - link "Эрдэнэтийн Уурхайчид 54, Ховд Фалконс 49" [ref=e31] [cursor=pointer]:
          - /url: /games/70000000-0000-0000-0000-000000000202
          - generic [ref=e32]: MI
          - generic [ref=e33]: MIN
          - generic [ref=e34]: "54"
          - generic [ref=e35]: –
          - generic [ref=e36]: "49"
          - generic [ref=e37]: KHO
          - generic [ref=e38]: KH
          - generic [ref=e40]: Шууд · Урьдчилсан
        - link "Хасын Хүлэгүүд 88, SG Apes 76" [ref=e41] [cursor=pointer]:
          - /url: /games/70000000-0000-0000-0000-000000000200
          - generic [ref=e42]: KH
          - generic [ref=e43]: KHU
          - generic [ref=e44]: "88"
          - generic [ref=e45]: –
          - generic [ref=e46]: "76"
          - generic [ref=e47]: APE
          - generic [ref=e48]: AP
          - generic [ref=e50]: Албан ёсны
        - link "BCH Knights 91, Сэлэнгэ Бодонс 85" [ref=e51] [cursor=pointer]:
          - /url: /games/70000000-0000-0000-0000-000000000201
          - generic [ref=e52]: BC
          - generic [ref=e53]: BCH
          - generic [ref=e54]: "91"
          - generic [ref=e55]: –
          - generic [ref=e56]: "85"
          - generic [ref=e57]: SEL
          - generic [ref=e58]: SE
          - generic [ref=e60]: Албан ёсны
  - generic [ref=e61]:
    - link "Үндсэн агууламж руу шилжих" [ref=e62] [cursor=pointer]:
      - /url: "#main-content"
    - main [ref=e63]:
      - generic [ref=e64]:
        - generic [ref=e65]:
          - img [ref=e67]
          - generic [ref=e72]: Хуудас олдсонгүй
          - generic [ref=e73]: Таны хайсан хуудас байхгүй эсвэл устгагдсан байна.
        - button "Нүүр хуудас руу буцах" [ref=e75]:
          - link "Нүүр хуудас руу буцах" [ref=e76] [cursor=pointer]:
            - /url: /
  - contentinfo [ref=e77]:
    - generic [ref=e78]:
      - generic [ref=e79]:
        - generic [ref=e80]:
          - link "Оноо" [ref=e81] [cursor=pointer]:
            - /url: /
            - img [ref=e83]
            - text: Оноо
          - paragraph [ref=e86]: Монголын сагсан бөмбөгийн лигийн албан ёсны статистик платформ. Бүх тоглолтын тоо баримт, шалгуур, тоглогчдын мэдээлэл.
        - generic [ref=e87]:
          - heading "Хуудсууд" [level=3] [ref=e88]
          - navigation "Багцын холбоосууд" [ref=e89]:
            - link "Тоглолтууд" [ref=e90] [cursor=pointer]:
              - /url: /games
            - link "Шалгуур" [ref=e91] [cursor=pointer]:
              - /url: /standings
            - link "Тоглогчид" [ref=e92] [cursor=pointer]:
              - /url: /players
            - link "Тэргүүлэгчид" [ref=e93] [cursor=pointer]:
              - /url: /leaders
            - link "Наградууд" [ref=e94] [cursor=pointer]:
              - /url: /awards
            - link "Баримт бичиг" [ref=e95] [cursor=pointer]:
              - /url: /docs
        - generic [ref=e96]:
          - heading "Лигийн мэдээлэл" [level=3] [ref=e97]
          - navigation "Лигийн холбоосууд" [ref=e98]:
            - link "Багууд" [ref=e99] [cursor=pointer]:
              - /url: /teams
              - text: Багууд
              - img [ref=e100]
            - link "2026 улирал" [ref=e104] [cursor=pointer]:
              - /url: /games?season=2026
              - text: 2026 улирал
              - img [ref=e105]
            - link "Группын шалгуур" [ref=e109] [cursor=pointer]:
              - /url: /standings?type=division
              - text: Группын шалгуур
              - img [ref=e110]
        - generic [ref=e114]:
          - heading "Платформ" [level=3] [ref=e115]
          - generic [ref=e116]:
            - generic [ref=e117]: "Бүртгэгдсэн тоглолт: 450+"
            - generic [ref=e118]: "Идэвхитэй тоглогч: 120+"
            - generic [ref=e119]: "Баг: 16"
      - generic [ref=e120]:
        - paragraph [ref=e121]: © 2026 Оноо. Бүх эрх хуулиар хамгаалагдсан.
        - paragraph [ref=e122]: Монголын Сагсан Бөмбөгийн Холбоо
  - region "Notifications alt+T"
  - generic [ref=e127] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e128]:
      - img [ref=e129]
    - generic [ref=e132]:
      - button "Open issues overlay" [ref=e133]:
        - generic [ref=e134]:
          - generic [ref=e135]: "0"
          - generic [ref=e136]: "1"
        - generic [ref=e137]: Issue
      - button "Collapse issues badge" [ref=e138]:
        - img [ref=e139]
  - alert [ref=e141]
  - generic [ref=e143]:
    - generic [ref=e146]:
      - button "Copy element" [ref=e148] [cursor=pointer]:
        - img [ref=e150]
      - button "Comment on element" [ref=e153] [cursor=pointer]:
        - img [ref=e154]
      - button "Style element" [ref=e157] [cursor=pointer]:
        - img [ref=e158]
    - button "Collapse toolbar" [expanded] [ref=e160] [cursor=pointer]:
      - img [ref=e161]
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
      |                                        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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